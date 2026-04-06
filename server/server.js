const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/chirper";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => console.error(err));
