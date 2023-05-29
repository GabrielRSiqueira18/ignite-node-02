import { FastifyReply, FastifyRequest } from "fastify"

export async function checkSessionIdExist(req: FastifyRequest, reply: FastifyReply) {
	const sessionId = req.cookies.sessionID

	if(!sessionId) {
		return reply.status(401).send('Unauthorized.')
	}
}