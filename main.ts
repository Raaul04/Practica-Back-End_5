import { ApolloServer } from "@apollo/server";
import { schema } from "./schema.ts";
import { MongoClient } from "mongodb";
import { UserModel,CommentModel,PostModel } from "./types.ts";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  throw new Error("Please provide a MONGO_URL");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("Connected to MongoDB");

const mongoDB = mongoClient.db("GraphQL");
const UsersCollection = mongoDB.collection<UserModel>("users");
const PostsCollection = mongoDB.collection<PostModel>("posts");
const CommentsCollection = mongoDB.collection<CommentModel>("comments");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async () =>  ({
    UserCollection: UsersCollection,
    PostCollection: PostsCollection,
    CommentCollection: CommentsCollection,
  }),
});

console.info(`Server ready at ${url}`);