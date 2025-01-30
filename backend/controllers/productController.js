const Products = require('../models/product');

// ดึงข้อมูลสินค้าทั้งหมด
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Products.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ดึงข้อมูลสินค้าตาม ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'ไม่พบสินค้า' });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// เพิ่มฟังก์ชันดึงหนังสือแนะนำ
exports.getRecommendedProducts = async (req, res) => {
  try {
    // ดึงหนังสือมา 3 เล่มที่ไม่ใช่เล่มปัจจุบัน
    const currentProductId = req.params.id;
    const recommendedProducts = await Products.find(
      { _id: { $ne: currentProductId } }
    ).limit(3);
    
    res.status(200).json(recommendedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};