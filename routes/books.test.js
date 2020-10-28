//First set the environment to test. This will cue config.js to set our db to books-test

process.env.NODE_ENV = "test";

//Import supertest pckg

const request = require("supertest");
const { response } = require("../app");

//Import app and database.
const app = require("../app");
const db = require("../db");

let bookISBN;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES('1111111', 'amazon.com/book', 'Maria Aldapa', 'english', 100, 'Penguin', 'My Book', 1989)
    RETURNING isbn`);
    bookISBN = result.rows[0].isbn
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
  });


describe("GET /books", async () => {
    test("Gets list of all books", async () => {
        const resp = await request(app).get(`/books`);
        const books = resp.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("amazon_url");
    })
})

describe("GET /books/:isbn", async () => {
    test("Get one book through isbn", async () => {
        const resp = await request(app).get(`/books/${bookISBN}`);
        const book = resp.body.book;
        expect(book).toHaveProperty("isbn");
        expect(book.isbn).toBe(`1111111`)
    })

    test("Bad ISBN returns 404", async () => {
        const resp = await request(app).get(`/books/1`);
        expect(resp.statusCode).toBe(404);
    })
})

describe("POST /books", async () => {
    test("Post a new book", async () => {
        const resp = await request(app).post(`/books`).send({
            isbn: '2222222',
            amazon_url: "https://amazon.com/bigbook",
            author: "James Reid",
            language: "english",
            pages: 200,
            publisher: "Penguin",
            title: "Big Book",
            year: 2000
          });
          expect(resp.statusCode).toBe(201);
          expect(resp.body.book).toHaveProperty("isbn");
    })

    test("Post a new book failure", async () => {
        const resp = await request(app).post(`/books`).send({isbn:2});
        expect(resp.statusCode).toBe(400)
    })
})

describe("PUT /books/:isbn", async () => {
    test("Update details on selected book", async () => {
        const resp = await request(app).put(`/books/${bookISBN}`).send({
            amazon_url: "https://amazon.com/bigbook",
            author: "James Reid",
            language: "english",
            pages: 200,
            publisher: "Penguin",
            title: "Big Book",
            year: 2000
          });
        expect(resp.body.book).toHaveProperty("isbn");
        expect(resp.body.book.title).toBe("Big Book");
    })

    test("Update book fail verification", async () => {
        const resp = await request(app).put(`/books/${bookISBN}`).send({not_a_book_property: "Hello"});
        expect(resp.statusCode).toBe(400);
    });

    test("Bad ISBN returns 404", async () => {
        const resp = await request(app).put(`/books/1`).send({
            amazon_url: "https://amazon.com/bigbook",
            author: "James Reid",
            language: "english",
            pages: 200,
            publisher: "Penguin",
            title: "Big Book",
            year: 2000
          })
        expect(resp.statusCode).toBe(404);
    })
})

describe("DELETE /books/:id", async function () {
    test("Deletes a single a book", async function () {
      const response = await request(app)
          .delete(`/books/${bookISBN}`)
      expect(response.body).toEqual({message: "Book deleted"});
    });
  });

afterAll(async function () {
    await db.end()
  });