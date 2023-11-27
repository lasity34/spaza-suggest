import express from 'express';

const router = express.Router();

export default function(spazaService) {

    // Client Registration
    router.post('/register', async (req, res) => {
        try {
            const username = req.body.username;
            if (!username) {
                return res.status(400).send('Username is required');
            }
            const code = await spazaService.registerClient(username);
            res.status(201).json({ code });
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // Client Login
    router.post('/login', async (req, res) => {
        try {
            const code = req.body.code;
            if (!code) {
                return res.status(400).send('Login code is required');
            }
            const client = await spazaService.clientLogin(code);
            if (client) {
                req.session.client = client;
                res.json({ message: "Logged in successfully", client });
            } else {
                res.status(401).send("Invalid login code");
            }
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // Make Product Suggestion
    router.post('/suggest', async (req, res) => {
        try {
            const { areaId, suggestion } = req.body;
            const clientId = req.session.client?.id; // Assuming session contains client id
            if (!clientId) {
                return res.status(401).send('Not logged in');
            }
            if (!areaId || !suggestion) {
                return res.status(400).send('Area ID and suggestion are required');
            }
            await spazaService.suggestProduct(areaId, clientId, suggestion);
            res.status(201).send('Suggestion made successfully');
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // View Own Suggestions
    router.get('/my-suggestions', async (req, res) => {
        try {
            const clientId = req.session.client?.id; // Assuming session contains client id
            if (!clientId) {
                return res.status(401).send('Not logged in');
            }
            const suggestions = await spazaService.suggestions(clientId);
            res.json(suggestions);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    return router;
}
