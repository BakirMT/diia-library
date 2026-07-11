import { addBook } from "./src/lib/db";
async function test() {
  try {
    const res = await addBook({
      title: 'Test', author: 'Test Author', isbn: '', category: '', tags: [], publisher: '', publishYear: '', language: '', pages: '', shelfLocation: '', copiesTotal: 1, status: 'Available', resourceLink: '', synopsis: ''
    });
    console.log("Success", res);
  } catch (e) {
    console.error("Error", e);
  }
  process.exit();
}
test();
