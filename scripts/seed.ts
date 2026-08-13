import mongoose from 'mongoose';
import { SEED_DATA } from '../src/data/seedData';
import { Word } from '../src/models/Word';
import { Category } from '../src/models/Category';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/imposter-game';

async function seedDatabase() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Clearing existing words and categories...');
    await Word.deleteMany({ addedBy: 'system' });
    await Category.deleteMany({});

    let totalWords = 0;

    for (const catData of SEED_DATA) {
      const categoryName = catData.category;
      const words = catData.words;

      const wordDocs = words.map(w => ({
        word: w,
        category: categoryName,
        addedBy: 'system' as const,
        roomCode: null,
        usageCount: 0
      }));

      await Word.insertMany(wordDocs, { ordered: false }).catch(err => {
        // Ignore duplicate key errors if any
        if (err.code !== 11000) {
          console.warn(`Warning inserting words for category ${categoryName}:`, err.message);
        }
      });

      await Category.create({
        name: categoryName,
        wordCount: words.length
      });

      totalWords += words.length;
      console.log(`Seeded category "${categoryName}" with ${words.length} words.`);
    }

    console.log(`\n✅ Database seeding finished successfully! Total categories: ${SEED_DATA.length}, Total pre-loaded words: ${totalWords}`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();
