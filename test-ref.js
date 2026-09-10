class DocRef {
  constructor(id, parent) {
    this.id = id;
    this.parent = parent;
  }
}
class ColRef {
  constructor(id, parent) {
    this.id = id;
    this.parent = parent;
  }
}

const lib = new DocRef('lib123', new ColRef('libraries', null));
const librarians = new ColRef('librarians', lib);
const myDoc = new DocRef('lib-doc', librarians);

console.log(myDoc.parent.parent.id);
