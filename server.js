require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection (Using Environment Variable for security)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("DB Connected"))
.catch((err) => console.error(err));

// User Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    watchHistory: [{
        title: String,
        image: String,
        date: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);

// 1. Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user in DB
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Email does not exist');

    // Compare passwords securely
    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if(isCorrectPassword){
        res.json({ success: true, message: 'Login successful', history: user.watchHistory });
    } else {
        res.status(401).send('Wrong Password');
    }
});

// 2. Sign Up Route
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({ email, password: hashedPassword });
        await user.save();

        res.json({ success: true, message: 'Account created' });
    } catch (err) {
        console.error(err);
        res.status(400).send("Error creating account");
    }
});

// 3. Get User History (Dashboard Feature)
app.get('/api/history/:email', async (req, res) => {
    const user = await User.findOne({ email: req.params.email });
    if(user) {
        res.json({ success: true, history: user.watchHistory });
    } else {
        res.status(404).send('User not found');
    }
});

// 4. Add to History (CRUD Action)
app.post('/api/history', async (req, res) => {
    const { email, title } = req.body;
    try {
        // We need a placeholder image for the demo
        const imageUrl = "https://via.placeholder.com/300x170/1a1a1a/white?text=Video+Thumbnail";

        const user = await User.findOneAndUpdate(
            { email },
            {
                $push: { watchHistory: { title, image: imageUrl } },
                $currentDate: { lastModified: true } // Update timestamp to trigger refresh
            },
            { new: true } // Return updated document
        );

        res.json({ success: true, history: user.watchHistory });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database Error');
    }
});

const PORT = process.env.PORT || 3000; // Use port provided by Vercel
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Create a file named **`.env`** in the same folder:
```
MONGO_URI="YOUR_MONGODB_CLUSTER_STRING_HERE"
```
*Paste your connection string from Step 1 into `MONGO_URI`, making sure to wrap it in quotes.*

---