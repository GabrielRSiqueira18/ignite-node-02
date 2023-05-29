import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from "../database";
import { checkSessionIdExist } from "../middlewares/check-session-id-exist";

// Testes Unitário => unidade da aplicação
// Teste Integração => comunicação entre duas ou mais unidades
// Teste e2e -> ponta a ponta => simulam um usuário operando na aplicação

export async function transactionsRoutes(app: FastifyInstance) {
	app.get('/',
	 {
		preHandler: [checkSessionIdExist],
	}, 
	async (req) => {
		
		const { sessionID } = req.cookies
		
		const transactions = await knex('transactions')
			.where({
				session_id: sessionID
			})
			.select()

		return { transactions }
	})

	app.get('/:id',
	{
		preHandler: [checkSessionIdExist],
	}, async (req) => {
		const getTransactionParamsSchema = z.object({
			id: z.string().uuid(),
		})

		const { id } = getTransactionParamsSchema.parse(req.params)

		const { sessionID } = req.cookies

		const transaction = await knex('transactions')
			.where({
				session_id: sessionID,
				id,
			})
			.first()

		return { transaction }
	})

	app.get('/summary',
	{
		preHandler: [checkSessionIdExist],
	},  async (req) => {
		const { sessionID } = req.cookies

		const summary = await knex('transactions')
		.where({
			session_id: sessionID
		})
		.sum('amount', { as: 'amount' })
			.first()

		return { summary }
	})

	app.post('/', async (req, reply) => {
		const createTransactionBodySchema = z.object({
			title: z.string(),
			amount: z.number(),
			type: z.enum(['credit', 'debit']),
		})

		const { amount, title, type } = createTransactionBodySchema.parse(req.body)

		let sessionId = req.cookies.sessionId

		if(!sessionId) {
			sessionId = randomUUID()

			reply.cookie('sessionID', sessionId, {
				path: '/',
				maxAge: 1000 * 60 * 60 * 24 * 7 // 7 Dias
			})
		}

		await knex('transactions')
			.insert({
				id: randomUUID(),
				title,
				amount: type === 'credit' ? amount : amount * -1,
				session_id: sessionId,
			})

			return reply.status(201).send()
	})
}