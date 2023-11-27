import assert from 'assert';

import pgPromise from 'pg-promise';
import dotenv from "dotenv";
import SpazaSuggest from '../services/spaza-suggest.js';

// Initialize environment variables
dotenv.config();

// Database connection
const connectionOptions = {
  connectionString: process.env.Spaza_Suggest_URL
};
const pgp = pgPromise();
const db = pgp(connectionOptions);
const spazaSuggest = SpazaSuggest(db);

describe ("The smart spaza", function() {

    beforeEach(async function() {

        await db.none(`delete from accepted_suggestion`);
        await db.none(`delete from suggestion`);
        await db.none(`delete from spaza`);
        await db.none(`delete from spaza_client`);
        
    });

    it("should be able to list areas", async function() {
        
        const areas = await spazaSuggest.areas();
        assert.equal(5, areas.length);
        assert.equal('Khayelitsa - Site C', areas[2].area_name);

    });

    it("should be able to create a Spaza User and return a code", async function() {
        const code = await spazaSuggest.registerClient('spazani');
        assert.ok(code);
    });

    it("should be able to find  a user using a code", async function() {
        const code = await spazaSuggest.registerClient('spazani');
        const client = await spazaSuggest.clientLogin(code);
        assert.equal('spazani', client.username);
    });

    it("should be able to suggest a product for an area", async function() {

        const code = await spazaSuggest.registerClient('spazani');
        const client = await spazaSuggest.clientLogin(code);

        const areas = await spazaSuggest.areas();
        const area = areas[2];

        await spazaSuggest.suggestProduct(area.id, client.id, 'Small Pizzas');

        const suggestions = await spazaSuggest.suggestionsForArea(area.id);

        assert.equal('Small Pizzas', suggestions[0].product_name)

    });

    it("should be able to get all the suggestions for an area", async function() {

        const code = await spazaSuggest.registerClient('spazani');
        const client = await spazaSuggest.clientLogin(code);

        const area1 = await spazaSuggest.findAreaByName('Nyanga');
        const area2 = await spazaSuggest.findAreaByName('Nyanga East');

        await spazaSuggest.suggestProduct(area1.id, client.id, 'Small Pizzas');
        await spazaSuggest.suggestProduct(area2.id, client.id, 'Small Pizzas');
        await spazaSuggest.suggestProduct(area1.id, client.id, 'Baked Beans');

        const suggestions = await spazaSuggest.suggestionsForArea(area1.id);

        assert.equal(2, suggestions.length);
        assert.equal('Small Pizzas', suggestions[0].product_name);
        assert.equal('Baked Beans', suggestions[1].product_name);

    });


    it("should be able to get all the suggestions made by a client", async function() {

        const code = await spazaSuggest.registerClient('spazani');
        const client = await spazaSuggest.clientLogin(code);

        const area1 = await spazaSuggest.findAreaByName('Nyanga');
        const area2 = await spazaSuggest.findAreaByName('Nyanga East');

        await spazaSuggest.suggestProduct(area1.id, client.id, 'Small Pizzas');
        await spazaSuggest.suggestProduct(area2.id, client.id, 'Small Pizzas');
        await spazaSuggest.suggestProduct(area1.id, client.id, 'Baked Beans');

        const suggestions = await spazaSuggest.suggestions(client.id);

        assert.equal(3, suggestions.length);
        assert.equal('Nyanga East', suggestions[1].area_name);

    });

    it("should be able to create a new Spaza shop", async function(){
        const area = await spazaSuggest.findAreaByName('Nyanga');
        const code = await spazaSuggest.registerSpaza('Spaza 101', area.id);
        assert.ok(code);
    });

    it("should be able to find a spaza shop using a code", async function(){

        const area = await spazaSuggest.findAreaByName('Nyanga')
        const code = await spazaSuggest.registerSpaza('Spaza 101', area.id);
        const spaza = await spazaSuggest.spazaLogin(code);
        assert.equal('Spaza 101', spaza.shop_name);
    });

    it("should be able to accept a suggestion", async function(){
        this.timeout(5000);

        const code = await spazaSuggest.registerClient('spazani');
        const client = await spazaSuggest.clientLogin(code);

        const area1 = await spazaSuggest.findAreaByName('Nyanga');
        const area2 = await spazaSuggest.findAreaByName('Nyanga East');

        await spazaSuggest.suggestProduct(area1.id, client.id, 'Small Pizzas');
        await spazaSuggest.suggestProduct(area2.id, client.id, 'Small Pizzas');
        await spazaSuggest.suggestProduct(area1.id, client.id, 'Baked Beans');

        const spazaCode = await spazaSuggest.registerSpaza('Spaza 101', area1.id);
        const spaza = await spazaSuggest.spazaLogin(spazaCode);
        assert.equal('Spaza 101', spaza.shop_name);

        const suggestions = await spazaSuggest.suggestionsForArea(area1.id);

        await spazaSuggest.acceptSuggestion(suggestions[0].id, spaza.id);
        await spazaSuggest.acceptSuggestion(suggestions[0].id, spaza.id);
        
        const acceptedBySpaza = await spazaSuggest.acceptedSuggestions(spaza.id);

        assert.equal(1, acceptedBySpaza.length);

        assert.equal('Small Pizzas', acceptedBySpaza[0].product_name);

    });

    after(function () {
        db.$pool.end()
    });
   
});