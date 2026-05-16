import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', async (req, res, next) => {
  try {
    const { search, sort = 'newest', page = 1 } = req.query;
    
    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const perPage = 10;
    const pageNum = Number(page);
    const skip = (pageNum - 1) * perPage;

    // Отримуємо всі записи для коректного пошуку без урахування регістру (через обмеження SQLite)
    let allAnnouncements = await prisma.announcement.findMany({
      orderBy
    });

    if (search) {
      const searchLower = search.toLowerCase();
      allAnnouncements = allAnnouncements.filter(a => 
        a.title.toLowerCase().includes(searchLower)
      );
    }

    const total = allAnnouncements.length;
    const announcements = allAnnouncements.slice(skip, skip + perPage);
    const totalPages = Math.ceil(total / perPage);

    res.render('index', {
      announcements,
      currentPage: pageNum,
      totalPages,
      search: search || '',
      sort
    });
  } catch (error) {
    next(error);
  }
});

app.get('/announcements', (req, res, next) => {
  res.render('new', {
    errors: {},
    data: null
  });
});

app.post('/announcements', async (req, res, next) => {
  try {
    const { title, description, price, category, contactInfo, pin } = req.body;
    const errors = {};

    if (!title || title.trim().length < 5) {
      errors.title = 'Назва має бути не менше 5 символів';
    } else if (title.trim().length > 100) {
      errors.title = 'Назва має бути не більше 100 символів';
    }

    if (!description || description.trim().length < 10) {
      errors.description = 'Опис має бути не менше 10 символів';
    }

    const validCategories = ['sale', 'service', 'job', 'other'];
    if (!validCategories.includes(category)) {
      errors.category = 'Оберіть категорію';
    }

    if (!price || isNaN(price) || Number(price) <= 0) {
      errors.price = 'Ціна має бути додатним числом';
    }

    if (!contactInfo || contactInfo.trim().length < 5) {
      errors.contactInfo = 'Контакти мають бути не менше 5 символів';
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      errors.pin = 'PIN-код має складатися з 4 цифр';
    }

    if (Object.keys(errors).length > 0) {
      return res.render('new', {
        errors,
        data: req.body
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        contactInfo: contactInfo.trim(),
        pin
      }
    });

    res.redirect(`/announcements/${announcement.id}`);
  } catch (error) {
    next(error);
  }
});

app.get('/announcements/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(404).render('404');
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return res.status(404).render('404');
    }

    res.render('announcement', { announcement });
  } catch (error) {
    next(error);
  }
});

app.delete('/announcements/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(404).end();
    }
    
    const { pin } = req.body;

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return res.status(404).end();
    }

    const masterPin = process.env.MASTER_PIN;
    if (announcement.pin !== pin && (!masterPin || pin !== masterPin)) {
      return res.status(403).json({ error: 'Невірний PIN-код' });
    }
    
    await prisma.announcement.delete({
      where: { id }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error');
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
