const express = require("express");
const bodyParser = require("body-parser");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServer } = require("@apollo/server");
const cors = require("cors");
const { default: axios } = require("axios");

const {USERS} = require('./user')
const {TODOS} = require('./todo')


async function startServer() {
  const app = express();
  const server = new ApolloServer({
    typeDefs: `
        type User {
            id: ID!
        name: String!
        username: String!
        email: String!
        phone: String!
        website: String!
        }
    

        type Todo {
            id: ID!
            title: String!
            completed: Boolean
            user: User
        }

        type Query {
            getTodos: [Todo!]!
            getAllUsers: [User]
            getUser(id: ID!): User
        }
    `,

    // Getting a timeout error
    /*
    resolvers: {
      Todo: {
        user: async (todo) =>
          (await axios.get(`https://jsonplaceholder.typicode.com/users/${todo.id}`))
            .data,
      },
      Query: {
        getTodos: async () =>
          (await axios.get("https://jsonplaceholder.typicode.com/todos")).data,
        getAllUsers: async () =>
          (await axios.get("https://jsonplaceholder.typicode.com/users")).data,
        getUser: async (parent, { id }) =>
          (await axios.get(`https://jsonplaceholder.typicode.com/users/${id}`))
            .data,
      },
    },
    */


    resolvers: {
      Todo: {
        user: (todo) => USERS.find(e => e.id === todo.id)
      },
      Query: {
        getTodos: () => TODOS,
        getAllUsers: async () => USERS,
        getUser: async (parent, { id }) => USERS.find(e => e.id === id)
      },
    },
  });

  app.use(bodyParser.json());
  app.use(cors());

  await server.start();

  app.use("/graphql", expressMiddleware(server));

  app.listen(8000, () => {
    console.log("Server started at port 8000");
  });
}

startServer();
