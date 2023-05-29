import { it, test, beforeAll, afterAll, describe, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
	beforeAll(async () => {
		await app.ready()
	})
	
	afterAll(async () => {
		await app.close()
	})

	beforeAll(() => {
		execSync('npm run knex migrate:down')
		execSync('npm run knex migrate:latest')
	})
	
	it('should be able to create a new transaction', async () => {
		await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit',
			})
			.expect(201)
			
	})

	it('should be able to list all transactions', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit',
			})

			const cokkies = createTransactionResponse.get('Set-Cookie')

			const listTransactionsResponse = await request(app.server)
				.get('/transactions')
				.set('Cookie', cokkies)
				.expect(200)

			expect(listTransactionsResponse.body.transactions).toEqual([
				expect.objectContaining({
					title: 'New transaction',
					amount: 5000,
				})
			])
	})

	it('should be able to get specif transaction', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New transaction',
				amount: 5000,
				type: 'credit',
			})

			const cokkies = createTransactionResponse.get('Set-Cookie')

			const listTransactionsResponse = await request(app.server)
				.get('/transactions')
				.set('Cookie', cokkies)
				.expect(200)

			const transactionId = listTransactionsResponse.body.transactions[0].id

			const getTransactionsResponse = await request(app.server)
				.get(`/transactions/${transactionId}`)
				.set('Cookie', cokkies)
				.expect(200)

			expect(getTransactionsResponse.body.transaction).toEqual(
				expect.objectContaining({
					title: 'New transaction',
					amount: 5000,
				})
			)
	})

	it('should be able to get the summary', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'Credit transaction',
				amount: 6000,
				type: 'credit',
			})

			const cokkies = createTransactionResponse.get('Set-Cookie')

			await request(app.server)
				.post('/transactions')
				.set('Cookie', cokkies)
				.send({
					title: 'Debit transaction',
					amount: 5000,
					type: 'credit',
				})

			const summaryTransactionsResponse = await request(app.server)
				.get('/transactions/summary')
				.set('Cookie', cokkies)
				.expect(200)

			expect(summaryTransactionsResponse.body.summary).toEqual({
				amount: 6000
			})
	})
})

