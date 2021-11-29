/**
 * Created on 11/14/21 by jovialis (Dylan Hanson)
 **/

const {gql} = require('apollo-server');

class GQLSchemaBuilder {

    #childBuilders = [];

    #querySignatures = [];
    #queryResolvers = [];

    #mutationSignatures = [];
    #mutationResolvers = [];

    #objects = [];
    #objectResolvers = [];

    constructor() {
    }

    #unifyInheritance(list, children) {
        return [].concat(list, ...(this.#childBuilders.map(children)));
    }

    get querySignatures() {
        return this.#unifyInheritance(this.#querySignatures, b => b.querySignatures);
    }

    get queryResolvers() {
        return this.#unifyInheritance(this.#queryResolvers, b => b.queryResolvers);
    }

    get mutationSignatures() {
        return this.#unifyInheritance(this.#mutationSignatures, b => b.mutationSignatures);
    }

    get mutationResolvers() {
        return this.#unifyInheritance(this.#mutationResolvers, b => b.mutationResolvers);
    }

    get objects() {
        return this.#unifyInheritance(this.#objects, b => b.objects);
    }

    get objectResolvers() {
        return this.#unifyInheritance(this.#objectResolvers, b => b.objectResolvers);
    }

    addBuilder(builder) {
        this.#childBuilders.push(builder);
    }

    addMutation(signatures, resolvers, objects = null) {
        this.#mutationSignatures.push(signatures);
        this.#mutationResolvers.push(resolvers);

        if (objects) {
            this.#objects.push(objects);
        }
    }

    addQuery(signatures, resolvers, objects = null) {
        this.#querySignatures.push(signatures);
        this.#queryResolvers.push(resolvers);

        if (objects) {
            this.#objects.push(objects);
        }
    }

    addType(signatures, resolvers) {
        this.#objects.push(signatures);
        this.#objectResolvers.push(resolvers);
    }

    build() {
        let allObjects = Array.from(this.objects);
        let allResolvers = Array.from(this.objectResolvers);

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
        const objects = allObjects.reduce((prev, cur) => {
            return prev + cur + "\n";
        }, "");

        // Add all resolvers
        const resolvers = allResolvers.reduce((prev, cur) => {
            return {
                ...prev,
                ...cur
            };
        });

        return [gql(objects), resolvers];
    }

}

module.exports = GQLSchemaBuilder;