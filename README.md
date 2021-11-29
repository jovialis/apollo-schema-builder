# Apollo Schema Builder (ASB)
A collection of tools to help modularize your Apollo schema definitions.
## Usage
### Using the Builders
ASB provides a single class for inserting types, mutations, and queries.
```javascript
const SchemaBuilder = require('apollo-schema-builder');
const builder = new SchemaBuilder();
```
Let's add our first type to the builder.
```javascript
builder.addType(`
    type User {
        id: String!
        email: String!
        name: String!
    }
`, {
    User: {
        id(parent) {
            return parent.email;
        }
    }
});
```
Now, let's add our first query.
```javascript
builder.addQuery(`
    me: User
`, {
    me() {
        return ({
            email: 'mario@nintendo.com',
            name: 'Mario!'
        });
    },
    // ... Additional resolvers
});
```
Lastly, let's add a mutation.
*Note that you can define additional types (e.g. inputs) as a third argument.*
```javascript
builder.addMutation(`
    signupUser(details: UserSignupInput!): User!
`, {
    signupUser() {
        // Sign up the user!
    }
}, `
    input UserSignupInput {
        email: String!
        password: String!
    }
`);
```
Now that we've added all of our schemas, we just have to build them!
```javascript
const [gqlSchemas, gqlResolvers] = builder.build();

// We can now use them in our Apollo Server declaration.
const server = new ApolloServer({
    typeDefs: gqlSchemas,
    resolvers: gqlResolvers,
    // ...
});
```
### Nesting Builders
In order to promote modularity, you can nest as many builders as you want. These can be nested with infinite depth, and they will all be compiled together into a single schema.
```javascript
const myOrganizationBuilder = new SchemaBuilder();
// ... Add all organization-related schemas and declarations

// Now, add the builder as a child of the main builder.
builder.addBuilder(myOrganizationBuilder);

// Build like usual.
const [gqlSchemas, gqlResolvers] = builder.build();
```