const bcrypt = require('bcrypt'); // ใช้สำหรับเข้ารหัส password
const Users = require('../models/user'); // ดึง schema ของ user จาก model
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET ; // Secret Key
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



// ดึงข้อมูลผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user.userId;  // ใช้ userId ที่ได้จาก token

    const user = await Users.findById(userId);  // ค้นหาผู้ใช้ตาม userId

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);  // ส่งข้อมูลของผู้ใช้ที่ล็อกอินกลับ
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// สร้างผู้ใช้ใหม่ (Signup)
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone_number, password } = req.body;

    // ตรวจสอบว่า email มีในระบบหรือยัง
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists!' });
    }

    // เข้ารหัส Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = new Users({
      name,
      email,
      phone_number,
      password: hashedPassword,
      
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: 'User created successfully!', user: savedUser });
  } catch (err) {
    res.status(500).json({ error: err.message , message: 'Signup ERROR'} );

  }
};

// Login (ตรวจสอบ email และ password)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ค้นหา user จาก email
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // ตรวจสอบ password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials!' });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, // Payload
      JWT_SECRET, // Secret Key
      { expiresIn: '1h' } // Token มีอายุ 1 ชั่วโมง
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// สร้างผู้ใช้ใหม่จากการล็อกอิน Google (Google Login)
// ฟังก์ชัน login ด้วย Google


exports.loginWithGoogle = async (req, res) => {
  try {
    // ดึง id_token จาก Authorization header
    const id_token = req.headers.authorization?.split(' ')[1]; // แยก Bearer token

    if (!id_token) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    // ตรวจสอบ id_token กับ Google
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    }).catch((error) => {
      return res.status(401).json({ message: 'Invalid ID token', error: error.message });
    });

    const payload = ticket.getPayload(); // ข้อมูลผู้ใช้จาก Google
    const { sub: googleId, name, email, picture: imageUrl } = payload;

    // ตรวจสอบว่าผู้ใช้อยู่ในระบบหรือไม่
    let user = await Users.findOne({ email });

    if (!user) {
      // สร้างผู้ใช้ใหม่หากยังไม่มีในระบบ
      user = new Users({
        name,
        email,
        googleId,
        imageUrl,
      });

      await user.save(); // บันทึกผู้ใช้ใหม่ลงฐานข้อมูล
    }

    // สร้าง JWT Token ทุกครั้งที่ล็อกอิน
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generated:', token);

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
      },
    });

  } catch (err) {
    console.error('Error during loginWithGoogle:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Add this to userController.js
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;
    
    // Find user and update
    const user = await Users.findByIdAndUpdate(
      userId,
      updates,
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add to userController.js
exports.checkAdminRole = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await Users.findById(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

