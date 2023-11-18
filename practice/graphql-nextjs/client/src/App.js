import React from "react";
import { gql, useQuery } from "@apollo/client";
import "./style.css";

const query = gql`
  query GetTodos {
    getTodos {
      id
      title
      completed
      user {
        id
        name
      }
    }
  }
`;

function App() {
  const { data, loading } = useQuery(query);

  if (loading) return <h1>Loading ...</h1>;
  return (
    <div className="App">
    <h1>Data from GraphQL Query</h1>
      <table className="todo-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          {data.getTodos.map((todo) => (
            <tr key={todo.id}>
              <td>{todo.title}</td>
              <td>{todo?.user?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
