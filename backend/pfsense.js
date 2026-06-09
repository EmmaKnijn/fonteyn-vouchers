const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
require('dotenv').config();

const baseURL = process.env.PF_API_URL 
  ? process.env.PF_API_URL.replace('/api/v1/firewall/pf/auth', '').replace(/\/+$/, '') 
  : 'https://192.168.106.64';

const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();

if (process.env.PF_SSL_VERIFY !== 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const client = wrapper(axios.create({
  baseURL,
  withCredentials: true,
  jar,
  maxRedirects: 5
}));

let currentZone = null;

const getCsrfToken = (html) => {
  const $ = cheerio.load(html);
  let token = $('input[name="__csrf_magic"]').val();
  if (!token) {
     const match = html.match(/var\s+csrfMagicToken\s*=\s*['"](sid:[a-z0-9,;]+)['"]/i);
     if (match) token = match[1];
  }
  return token;
};

const login = async () => {
  try {
    const res1 = await client.get('/');
    const csrfToken = getCsrfToken(res1.data);

    if (!csrfToken) {
      // Might be already logged in
      if (res1.data.includes('Logout')) return true;
      throw new Error('Could not find CSRF token on login page');
    }

    const loginData = new URLSearchParams();
    loginData.append('__csrf_magic', csrfToken);
    loginData.append('usernamefld', process.env.PF_USERNAME);
    loginData.append('passwordfld', process.env.PF_PASSWORD);
    loginData.append('login', 'Sign In');

    const res2 = await client.post('/index.php', loginData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (res2.data.includes('Username or Password incorrect') || res2.data.includes('id="login"')) {
      throw new Error('pfSense login failed. Check credentials.');
    }
    return true;
  } catch (error) {
    console.error('pfSense login error:', error.message);
    throw error;
  }
};

const getCpZone = async () => {
  if (currentZone) return currentZone;
  
  const res = await client.get('/services_captiveportal.php');
  const $ = cheerio.load(res.data);
  const zoneLink = $('table tbody tr a.fa-pencil').first().attr('href');
  
  if (zoneLink) {
    const url = new URL(zoneLink, baseURL);
    currentZone = url.searchParams.get('zone');
    return currentZone;
  }
  throw new Error('No captive portal zones found on this pfSense router.');
};

const generateVouchers = async () => {
  await login();
  const zone = await getCpZone();

  // 1. Get current rolls to find the next roll ID
  const res1 = await client.get(`/services_captiveportal_vouchers.php?zone=${zone}`);
  let csrfToken = getCsrfToken(res1.data);
  const $ = cheerio.load(res1.data);
  
  let maxRoll = -1;
  $('table tbody tr').each((i, el) => {
    const rollText = $(el).find('td').first().text().trim();
    const rollNum = parseInt(rollText, 10);
    if (!isNaN(rollNum) && rollNum > maxRoll) {
      maxRoll = rollNum;
    }
  });
  
  const newRollId = maxRoll + 1;

  // 2. Create the roll of size 1 (1 voucher per guest)
  const res2 = await client.get(`/services_captiveportal_vouchers_edit.php?zone=${zone}`);
  csrfToken = getCsrfToken(res2.data) || csrfToken;

  const rollData = new URLSearchParams();
  rollData.append('__csrf_magic', csrfToken);
  rollData.append('zone', zone);
  rollData.append('number', newRollId.toString());
  rollData.append('minutes', '1440'); // 24 hours
  rollData.append('count', '1');
  rollData.append('descr', 'Fonteyn Vouchers App');
  rollData.append('save', 'Save');

  await client.post(`/services_captiveportal_vouchers_edit.php?zone=${zone}`, rollData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  // 3. Download the CSV to extract the voucher code
  const res3List = await client.get(`/services_captiveportal_vouchers.php?zone=${zone}`);
  const $2 = cheerio.load(res3List.data);
  let csvLink = '';
  
  // Find the row that has our new roll number
  $2('table tbody tr').each((i, el) => {
    const rollText = $2(el).find('td').first().text().trim();
    if (rollText === newRollId.toString()) {
      csvLink = $2(el).find('a[href*="act=csv"]').attr('href');
    }
  });

  if (!csvLink) {
    // Fallback: get the last csv link
    const allLinks = $2('a[href*="act=csv"]');
    if (allLinks.length > 0) {
      csvLink = $2(allLinks[allLinks.length - 1]).attr('href');
    }
  }

  if (!csvLink) throw new Error('Could not find CSV export link for the new roll.');

  const res3 = await client.get('/' + csvLink);
  const csvData = res3.data.trim().split('\n');
  
  // Find the first actual data row
  let codeRow = null;
  for (let line of csvData) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.toLowerCase().includes('"voucher"')) {
      continue;
    }
    codeRow = line;
    break;
  }
  
  if (!codeRow) throw new Error('Failed to parse voucher CSV');
  
  // Extract the first column value
  const voucherCode = codeRow.split(',')[0].replace(/"/g, '').trim();

  return {
    data: [{
      voucher: voucherCode,
      roll: newRollId,
      expires: '24 Hours'
    }]
  };
};

const deleteVoucher = async (rollId) => {
  await login();
  const zone = await getCpZone();
  
  const res1 = await client.get(`/services_captiveportal_vouchers.php?zone=${zone}`);
  const csrfToken = getCsrfToken(res1.data);
  
  const delData = new URLSearchParams();
  delData.append('__csrf_magic', csrfToken);
  delData.append('act', 'del');
  delData.append('id', rollId.toString());
  
  await client.post(`/services_captiveportal_vouchers.php?zone=${zone}`, delData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  return true;
};

// We don't need to fetch from pfSense to list vouchers anymore, 
// because pfSense doesn't store unactivated individual codes in a list.
// We just return an empty array and let the local MySQL DB provide the list.
const listVouchers = async () => {
  return { data: [] };
};

module.exports = {
  pfClient: client,
  login,
  getCpZone,
  generateVouchers,
  listVouchers,
  deleteVoucher
};
