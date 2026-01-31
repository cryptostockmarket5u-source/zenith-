import { Request, Response } from 'express';
import { query } from '../db';

export const registerUser = async (req: Request, res: Response) => {
    const { username, email } = req.body;
    try {
        const result = await query(
            'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
            [username, email]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
};
