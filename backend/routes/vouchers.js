const express = require('express');
const { VoucherMetadata } = require('../db');
const pfsense = require('../pfsense');

const router = express.Router();

// Middleware to ensure authentication
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Middleware to ensure admin/editor
const requireEditor = (req, res, next) => {
  if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
    return res.status(403).json({ message: 'Forbidden: Requires editor privileges' });
  }
  next();
};

// List all vouchers (relying on local metadata as the source of truth)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Fetch local metadata
    const metadataList = await VoucherMetadata.findAll();

    // Format the response
    const formatted = metadataList.map(meta => ({
      voucher: meta.voucher_id,
      guest_name: meta.guest_name,
      location: meta.location,
      open_text: meta.open_text,
      activated: meta.activated,
      roll: 'Unknown', // We no longer fetch this from pfSense per request to keep it fast
      expires: '24 Hours'
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vouchers', error: error.message });
  }
});

// Create a voucher and attach metadata
router.post('/', requireEditor, async (req, res) => {
  try {
    const { guest_name, location, open_text } = req.body;
    
    if (!guest_name) {
      return res.status(400).json({ message: 'Guest name is required (One voucher per guest)' });
    }

    // Generate 1 voucher on pfSense
    const pfResponse = await pfsense.generateVouchers(1);
    
    // Determine the voucher code from response (the pfsense-api format varies, assuming it's in data array)
    const vouchers = pfResponse.data || [];
    if (vouchers.length === 0) {
      throw new Error('pfSense did not return any vouchers');
    }
    const voucher_id = vouchers[0].voucher || vouchers[0];

    // Store metadata locally
    const metadata = await VoucherMetadata.create({
      voucher_id,
      guest_name,
      location,
      open_text
    });

    res.json({ message: 'Voucher created', voucher_id, metadata });
  } catch (error) {
    res.status(500).json({ message: 'Error creating voucher', error: error.message });
  }
});

// Delete a voucher
router.delete('/:id', requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete from pfSense
    await pfsense.deleteVoucher(id);

    // Delete local metadata
    await VoucherMetadata.destroy({ where: { voucher_id: id } });

    res.json({ message: 'Voucher deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting voucher', error: error.message });
  }
});

// Toggle voucher activation status
router.patch('/:id/toggle', requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await VoucherMetadata.findOne({ where: { voucher_id: id } });
    
    if (!metadata) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    metadata.activated = !metadata.activated;
    await metadata.save();

    res.json({ message: 'Voucher status toggled', activated: metadata.activated });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling voucher', error: error.message });
  }
});

module.exports = router;
