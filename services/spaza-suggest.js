import ShortUniqueId from 'short-unique-id';

export default function SpazaSuggest (db){

    const uid = new ShortUniqueId({ length: 5 });

    //// returns client code
    async function registerClient(username){
        // get the code

        const uniqCode = uid();
        await db.none(`insert into spaza_client (username, code) values ($1, $2)`, [username, uniqCode])
        return uniqCode;

    }

    // returns the user if it's a valid code
    async function clientLogin(code)  {
        const client = await db.oneOrNone(`select * from spaza_client where code = $1`, [code]);
        return client
    }

    // return all areas
    async function areas() {
        const areas = await db.manyOrNone(`select * from area order by area_name asc`)
        return areas;
    }

    async function findAreaByName(name) {
        const area = await db.oneOrNone(`select * from area where area_name = $1`, [name])
        return area;
    }

    async function suggestProduct(areaId, clientId, suggestion) {
        await db.none(`insert into suggestion(area_id, client_id, product_name) values ($1, $2, $3)`, 
            [areaId, clientId, suggestion])
    }

    async function suggestionsForArea(areaId) {
        return await db.manyOrNone(`select * from suggestion where area_id = $1`, [areaId]);
    }

    // show all the suggestions made by a user
    // TODO - review this... do we want this for a region...?
    async function suggestions(clientId) {
        return await db.manyOrNone(`select * from suggestion join area on suggestion.area_id = area.id where client_id = $1`, [clientId]);
    }

    // upvote a given suggesstion
    function likeSuggestion(suggestionId, userId) {
        `insert into liked_suggestion (suggestion_id, user_id) values ($1, $2)`;
    }

    // create the spaza shop and return a code
    async function registerSpaza(name, areaId) {
        
        const uniqCode = uid();
        await db.none(`insert into spaza (shop_name, area_id, code) values ($1, $2, $3)`, 
            [name, areaId, uniqCode]);
        return uniqCode;

    }
    
    // return the spaza name & id  and areaId for the spaza shop
    async function spazaLogin(code) {
        const spaza = await db.oneOrNone(`select * from spaza where code = $1`, [code]);
        return spaza;
    }
    
    // show all the suggestions for a given area
    // function suggestionsForArea(areaId) {
    //     ``
    // }
    
    async function alreadyAcceptedSuggestionForSpaza(suggestionId, spazaId) {
        const count = await db.one(`select count(*) from accepted_suggestion where suggestion_id = $1 and spaza_id = $2`,
            [suggestionId, spazaId], row => row.count);
        return count == 1;
    }

    async function acceptSuggestion(suggestionId, spazaId) {
        if (!await alreadyAcceptedSuggestionForSpaza(suggestionId, spazaId)){
            await db.none(`insert into accepted_suggestion(suggestion_id, spaza_id) values ($1, $2)`, [suggestionId, spazaId])
        }
    }

    // return all the accepted suggestions for the spazaId provided
    async function acceptedSuggestions(spazaId) {

        const suggesstions = await db.manyOrNone(`
            select * from suggestion join accepted_suggestion 
            on suggestion.id = accepted_suggestion.suggestion_id 
            where accepted_suggestion.spaza_id = $1`, [spazaId])
        
        // console.log(suggesstions);

        return suggesstions;
    }

    return {
        acceptSuggestion,
        acceptedSuggestions,
        areas,
        findAreaByName,
        registerSpaza,
        registerClient,
        spazaLogin,
        suggestProduct,
        suggestions,
        suggestionsForArea,
        likeSuggestion,
        clientLogin
    }
}
