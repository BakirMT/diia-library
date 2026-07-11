import { addMember, addBook } from "./src/lib/db";
async function test() {
  try {
    const res = await addMember({
      name: 'Test', gender: '', dob: '', email: '', phone: '', address: '', membershipType: 'Standard', fee: '', studentClass: '', expiryDate: '', status: 'Active', id: 'LIB123', booksBorrowed: 0, fallback: 'TE'
    });
    console.log("Success", res);
  } catch (e) {
    console.error("Error", e);
  }
  process.exit();
}
test();
