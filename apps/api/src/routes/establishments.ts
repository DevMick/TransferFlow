import { Hono } from 'hono';
import { db } from '../db';
import { establishment } from '../db/schema';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const establishmentsRouter = new Hono();

const createEstablishmentSchema = z.object({
  logoPath: z.string().optional(),
  nomEtablissement: z.string().min(1, 'Le nom de l\'établissement est requis'),
  formeJuridique: z.string().optional(),
  adresseRue: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
});

const updateEstablishmentSchema = createEstablishmentSchema.partial();

// POST /api/establishments/upload - Upload d'image
establishmentsRouter.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }

    // Convertir le fichier en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return c.json({ url: dataUrl });
  } catch (error) {
    return c.json({ error: 'Erreur lors de l\'upload' }, 500);
  }
});

// GET /api/establishments - Liste tous les établissements
establishmentsRouter.get('/', async (c) => {
  try {
    const establishments = await db.select().from(establishment).orderBy(establishment.createdAt);
    return c.json({ establishments });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la récupération des établissements' }, 500);
  }
});

// GET /api/establishments/:id - Récupère un établissement par ID
establishmentsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const establishmentData = await db
      .select()
      .from(establishment)
      .where(eq(establishment.id, id))
      .limit(1);
    
    if (!establishmentData.length) {
      return c.json({ error: 'Établissement non trouvé' }, 404);
    }
    
    return c.json({ establishment: establishmentData[0] });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la récupération de l\'établissement' }, 500);
  }
});

// POST /api/establishments - Crée un nouvel établissement
establishmentsRouter.post('/', zValidator('json', createEstablishmentSchema), async (c) => {
  const data = c.req.valid('json');
  try {
    const newEstablishment = await db
      .insert(establishment)
      .values(data)
      .returning();
    
    return c.json({ establishment: newEstablishment[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Erreur lors de la création de l\'établissement' }, 500);
  }
});

// PUT /api/establishments/:id - Met à jour un établissement
establishmentsRouter.put('/:id', zValidator('json', updateEstablishmentSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  try {
    const updated = await db
      .update(establishment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(establishment.id, id))
      .returning();
    
    if (!updated.length) {
      return c.json({ error: 'Établissement non trouvé' }, 404);
    }
    
    return c.json({ establishment: updated[0] });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la mise à jour de l\'établissement' }, 500);
  }
});

// DELETE /api/establishments/:id - Supprime un établissement
establishmentsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const deleted = await db
      .delete(establishment)
      .where(eq(establishment.id, id))
      .returning();
    
    if (!deleted.length) {
      return c.json({ error: 'Établissement non trouvé' }, 404);
    }
    
    return c.json({ message: 'Établissement supprimé avec succès' });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la suppression de l\'établissement' }, 500);
  }
});

export { establishmentsRouter };
