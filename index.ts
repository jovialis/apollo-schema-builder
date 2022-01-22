/**
 * Created on 11/14/21 by jovialis (Dylan Hanson)
 **/

import {gql} from "apollo-server";
import {DocumentNode} from "graphql";

export class ApolloSchemaBuilder {

    private _childBuilders: ApolloSchemaBuilder[];

    private _querySignatures: string[] = [];
    private _queryResolvers: object[] = [];

    private _mutationSignatures: string[] = [];
    private _mutationResolvers: object[] = [];

    private _objects: string[] = [];
    private _objectResolvers: object[] = [];

    constructor() {
    }

    /**
     * Utility method to unify members of child inheritance chain
     * @param list List of generics to unify against
     * @param childHandler Lambda to draw values from
     * @private
     */
    private unifyInheritance<Type>(list: Type[], childHandler: (builder: ApolloSchemaBuilder) => Type[]) {
        return [].concat(list, ...(this._childBuilders.map(childHandler)));
    }

    /**
     * Gets query signatures for this and all children
     */
    public get querySignatures() {
        return this.unifyInheritance(this._querySignatures, builder => builder.querySignatures);
    }

    /**
     * Gets query resolvers for this and all children
     */
    public get queryResolvers() {
        return this.unifyInheritance(this._queryResolvers, builder => builder.queryResolvers);
    }

    /**
     * Get mutation signatures for this and all children
     */
    public get mutationSignatures() {
        return this.unifyInheritance(this._mutationSignatures, b => b.mutationSignatures);
    }

    /**
     * Get mutation resolvers for this and all children
     */
    public get mutationResolvers() {
        return this.unifyInheritance(this._mutationResolvers, b => b.mutationResolvers);
    }

    /**
     * Get objects for this and all children
     */
    public get objects() {
        return this.unifyInheritance(this._objects, b => b.objects);
    }

    /**
     * Get object resolvers for this and all children
     */
    public get objectResolvers() {
        return this.unifyInheritance(this._objectResolvers, b => b.objectResolvers);
    }

    /**
     * Adds a child builder
     * @param builder Builder to add children
     */
    public addBuilder(builder: ApolloSchemaBuilder): ApolloSchemaBuilder {
        this._childBuilders.push(builder);
        return this;
    }

    /**
     * Adds a mutation to the builder
     * @param signatures Signatures to add to the builder
     * @param resolvers Resolvers to add to the builder
     * @param objects Optionally, any objects that should also be added e.g. input types
     */
    public addMutation(signatures: string, resolvers: object, objects?: string): ApolloSchemaBuilder {
        this._mutationSignatures.push(signatures);
        this._mutationResolvers.push(resolvers);

        if (objects) {
            this._objects.push(objects);
        }

        return this;
    }

    /**
     * Adds a query to the builder
     * @param signatures Signatures to add to the builder
     * @param resolvers Resolvers to add to the builder
     * @param objects Optionally, any objects that should be added e.g. input types
     */
    public addQuery(signatures: string, resolvers: object, objects?: string): ApolloSchemaBuilder {
        this._querySignatures.push(signatures);
        this._queryResolvers.push(resolvers);

        if (objects) {
            this._objects.push(objects);
        }

        return this;
    }

    /**
     * Adds an Object type to the builder
     * @param signatures Signature for the type
     * @param resolvers Resolver for the type
     */
    addType(signatures: string, resolvers: object): ApolloSchemaBuilder {
        this._objects.push(signatures);
        this._objectResolvers.push(resolvers);
        return this;
    }

    /**
     * Builds a document and all relevant resolvers
     */
    build(): [DocumentNode, object] {
        let allObjects: string[] = Array.from(this.objects);
        let allResolvers: object[] = Array.from(this.objectResolvers);

        // Condense query signatures
        allObjects.push(`type Query {
            ${this.querySignatures.reduce((prev, cur) => {
            return prev + cur + "\n";
        }, "")}
        }`);

        // Condense query resolvers
        allResolvers.push({
            Query:
                this.queryResolvers.reduce((prev, cur) => {
                    return {
                        ...prev,
                        ...cur
                    }
                }, {})
        });

        // Condense mutation signatures
        allObjects.push(`type Mutation {
            ${this.mutationSignatures.reduce((prev, cur) => {
            return prev + cur + "\n";
        }, "")}
        }`);

        // Condense query resolvers
        allResolvers.push({
            Mutation:
                this.mutationResolvers.reduce((prev, cur) => {
                    return {
                        ...prev,
                        ...cur
                    }
                }, {})
        });

        // Add all object types
        const objects = allObjects.reduce((prev: string, cur: string) => {
            return prev + cur + "\n";
        }, "");

        // Add all resolvers
        const resolvers = allResolvers.reduce((prev: object, cur: object) => {
            return {
                ...prev,
                ...cur
            };
        });

        return [gql(objects), resolvers];
    }

}