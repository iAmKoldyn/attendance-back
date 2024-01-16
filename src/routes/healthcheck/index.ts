export default async function (fastify): Promise<void> {
  fastify.get('/', (req, rep) => {
    rep.send({
      ok: true
    });
  });
}
