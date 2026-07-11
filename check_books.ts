import { fetchBooks } from './src/lib/db';

async function main() {
  try {
    const books = await fetchBooks();
    console.log(`Found ${books.length} books.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
