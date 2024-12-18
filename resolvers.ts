import { Collection, ObjectId } from "mongodb"
import {  User, UserModel, Post, PostModel, Comment,CommentModel } from "./types.ts"

type QueryUserArgs = {
    id: string;
  };
  
  type QueryPostArgs = {
    id: string;
  };
  
  type QueryCommentArgs = {
    id: string;
  };

  export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    posts?: string[];
    comments?: string[];
    likedPosts?: string[];
  }
  export interface UpdateUserInput {
    name: string
    email: string
    password: string
    posts: string[] 
    comments: string[]
    likedPosts: string[]
      
  }


type Context={
    UserCollection: Collection<UserModel>
    PostCollection: Collection<PostModel>
    CommentCollection: Collection<CommentModel>
}




export const resolvers = { 
    User:{
        id:(parent:UserModel)=>{
            return parent._id?.toString();
        },
        posts:async(parent:UserModel, _:unknown, ctx:Context)=>{
            const ids=parent.posts;
            return await ctx.PostCollection.find({_id: {$in: ids}}).toArray();
            
        },
        comments:async(parent:UserModel, _:unknown, ctx:Context)=>{
            const ids=parent.comments;
            return await ctx.CommentCollection.find({_id: {$in: ids}}).toArray(); 

        },
        likedPosts:async(parent:UserModel, _:unknown, ctx:Context)=>{
            const ids=parent.likedPosts;
            return await ctx.PostCollection.find({_id: {$in: ids}}).toArray();

        }
            
        
    },

    Post:{
        id:(parent:PostModel)=>{
            return parent._id?.toString();
        },
        author:async(parent:PostModel, _:unknown, ctx:Context)=>{
            const ids=parent.author;
            return await ctx.UserCollection.find({_id: {$in: ids}}).toArray();

        },
        comments:async(parent:PostModel, _:unknown, ctx:Context)=>{
            const ids=parent.comments;
            return await ctx.CommentCollection.find({_id: {$in: ids}}).toArray();

        },
        likes:async(parent:PostModel, _:unknown, ctx:Context)=>{
            const ids=parent.likes;
            return await ctx.UserCollection.find({_id: {$in: ids}}).toArray();

        }
    },
    Comment:{
        id:(parent:CommentModel)=>{
            return parent._id?.toString();
        },
        author:async(parent:CommentModel, _:unknown, ctx:Context)=>{
            const ids=parent.author;
            return await ctx.UserCollection.find({_id: {$in: ids}}).toArray();

        },

        post:async(parent:CommentModel, _:unknown, ctx:Context)=>{
            const ids=parent.post;
            return await ctx.PostCollection.find({_id: {$in: ids}}).toArray();

        }
        

    },
    Query: {
        users:async(_:unknown, __:unknown, ctx:Context): Promise<UserModel[]>=>{
            return await ctx.UserCollection.find().toArray();
        },
        user: async(_:unknown, args:QueryUserArgs, ctx:Context): Promise<UserModel | null>=>{
            return await ctx.UserCollection.findOne({_id: args.id});
        } ,
        posts:async(_:unknown, __:unknown, ctx:Context): Promise<PostModel[]>=>{
            return await ctx.PostCollection.find().toArray();
        },
        post: async(_:unknown, args:QueryPostArgs, ctx:Context): Promise<PostModel | null>=>{
            return await ctx.PostCollection.findOne({_id: args.id});
        } ,
        comments:async(_:unknown, __:unknown, ctx:Context): Promise<CommentModel[]>=>{
            return await ctx.CommentCollection.find().toArray();
        },
        comment: async(_:unknown, args:QueryCommentArgs, ctx:Context): Promise<CommentModel | null>=>{
            return await ctx.CommentCollection.findOne({_id: args.id});
        } ,
    },
 

    Mutation:{
        createUser:async(
            _:unknown, 
            args:{ input: CreateUserInput },
            ctx:Context

        ):Promise<UserModel> =>{

            const { name, email, password, posts = [], comments = [], likedPosts = [] } = args.input;           
            const existsUser=await ctx.UserCollection.findOne({
                email
            });
            if(existsUser){
                throw new Error("User already exists");
            }
            const user = await ctx.UserCollection.insertOne({
                email,
                name,
                password,
                posts,
                comments,
                likedPosts
                
              });
              return {
                _id: user.insertedId,
                email,
                name,
                password,
                posts,
                comments,
                likedPosts
              };
            
      
        },


        updateUser: async (
            _: unknown,
            args: { id: string; input: UpdateUserInput },
            ctx: Context
        ): Promise<UserModel> => {
            const { id, input } = args;
        
            const userId = new ObjectId(id);
        
            const existingUser = await ctx.UserCollection.findOne({ _id: userId });
            if (!existingUser) {
                throw new Error("User not found");
            }
        
            const updateData = {
                name: input.name,
                email: input.email,
                password: input.password,
                posts: input.posts.map((postId) => new ObjectId(postId)),
                comments: input.comments.map((commentId) => new ObjectId(commentId)),
                likedPosts: input.likedPosts.map((likedPostId) => new ObjectId(likedPostId)),
            };
        
            const result = await ctx.UserCollection.updateOne(
                { _id: userId },
                { $set: updateData }
            );
        
            if (result.matchedCount === 0) {
                throw new Error("Failed to update the user. User not found.");
            }
        
            const updatedUser = await ctx.UserCollection.findOne({ _id: userId });
            if (!updatedUser) {
                throw new Error("Failed to retrieve updated user.");
            }
        
            return {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                password: updatedUser.password,
                posts: updatedUser.posts,
                comments: updatedUser.comments,
                likedPosts: updatedUser.likedPosts,
            };
        },
        


        deleteUser:async(
            _:unknown,
            args: {id:string},
            context:Context
            
        ): Promise<boolean> =>{
            const id=args.id;

            if (!id || !ObjectId.isValid(id)) {
                throw new Error("Invalid ID format");
            }

            const user=await context.UserCollection.findOne({_id: new ObjectId(id)});
            
            if(!user){
                throw new Error("User not found");
            }
            const postIds = user.posts || [];

            await context.PostCollection.deleteMany(
                { _id: { $in: postIds.map(id => new ObjectId(id)) } });

            const deleteresult=await context.UserCollection.deleteOne({_id: new ObjectId(id)});

            if(deleteresult.deletedCount===0){
                return false;
            }

            return true;        
        },
        
    },
};
