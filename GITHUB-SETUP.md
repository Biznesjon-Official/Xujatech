# GitHub Setup Guide

Loyihani GitHub ga yuklash va sozlash bo'yicha qo'llanma.

## 📋 Boshlashdan Oldin

1. GitHub account yarating (agar yo'q bo'lsa): https://github.com
2. Git o'rnatilganligini tekshiring:
   ```bash
   git --version
   ```

## 🚀 GitHub Repository Yaratish

### 1. GitHub da Repository Yaratish

1. GitHub ga kiring
2. "+" tugmasini bosing (yuqori o'ng burchakda)
3. "New repository" ni tanlang
4. Repository ma'lumotlarini kiriting:
   - **Repository name**: `xujatech-pos` (yoki o'zingizning nomi)
   - **Description**: "Modern POS va Ombor Boshqaruv Tizimi"
   - **Visibility**: Private yoki Public (tanlovingiz)
   - **Initialize**: README, .gitignore, license qo'shMANG (bizda bor)
5. "Create repository" tugmasini bosing

### 2. Local Repository ni GitHub ga Ulash

```bash
# 1. Git repository ni initialize qiling (agar qilinmagan bo'lsa)
git init

# 2. Barcha fayllarni staging ga qo'shing
git add .

# 3. Birinchi commit
git commit -m "Initial commit: Production-ready XUJATECh POS system"

# 4. Main branch yarating
git branch -M main

# 5. Remote repository ni qo'shing (YOUR-USERNAME ni o'zgartiring!)
git remote add origin https://github.com/YOUR-USERNAME/xujatech-pos.git

# 6. GitHub ga push qiling
git push -u origin main
```

## 🔐 Sensitive Ma'lumotlarni Himoya Qilish

### Tekshirish: .env Fayllar Git ga Qo'shilmaganligini Tasdiqlang

```bash
# .gitignore faylini tekshiring
cat .gitignore | grep .env

# Git status ni tekshiring
git status
```

Agar `.env` fayllari ko'rinsa, ularni o'chiring:

```bash
git rm --cached .env
git rm --cached backend/.env
git rm --cached desktop/.env
git commit -m "Remove .env files from git"
git push
```

### GitHub Secrets Sozlash (CI/CD uchun)

1. GitHub repository ga o'ting
2. "Settings" → "Secrets and variables" → "Actions"
3. "New repository secret" tugmasini bosing
4. Quyidagi secretlarni qo'shing:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
MONGO_PASSWORD=your-mongo-password
```

## 📝 README ni Yangilash

README.md faylida quyidagilarni o'zgartiring:

1. Repository URL:
   ```markdown
   git clone https://github.com/YOUR-USERNAME/xujatech-pos.git
   ```

2. Demo URL (agar mavjud bo'lsa):
   ```markdown
   🌐 Demo: https://yourdomain.com
   ```

3. Screenshot qo'shing (agar kerak bo'lsa):
   ```markdown
   ![Screenshot](./docs/screenshot.png)
   ```

## 🏷️ Release Yaratish

### Version Tag Qo'shish

```bash
# Tag yaratish
git tag -a v1.0.0 -m "Release version 1.0.0"

# Tag ni push qilish
git push origin v1.0.0
```

### GitHub Release Yaratish

1. GitHub repository ga o'ting
2. "Releases" → "Create a new release"
3. Tag ni tanlang: `v1.0.0`
4. Release title: "XUJATECh POS v1.0.0"
5. Description yozing (CHANGELOG.md dan nusxa oling)
6. "Publish release" tugmasini bosing

## 🔄 Branches Strategiyasi

### Main Branch (Production)
```bash
git checkout main
```

### Development Branch
```bash
# Development branch yaratish
git checkout -b develop

# Push qilish
git push -u origin develop
```

### Feature Branch
```bash
# Feature branch yaratish
git checkout -b feature/yangi-funksiya

# O'zgarishlarni commit qilish
git add .
git commit -m "feat: yangi funksiya qo'shildi"

# Push qilish
git push -u origin feature/yangi-funksiya
```

## 🤝 Collaboration

### Contributors Qo'shish

1. Repository → "Settings" → "Collaborators"
2. "Add people" tugmasini bosing
3. GitHub username yoki email kiriting

### Branch Protection Rules

1. Repository → "Settings" → "Branches"
2. "Add rule" tugmasini bosing
3. Branch name pattern: `main`
4. Quyidagilarni yoqing:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

## 📊 GitHub Actions (CI/CD)

GitHub Actions allaqachon sozlangan (`.github/workflows/ci.yml`).

### Workflow ni Tekshirish

1. Repository → "Actions" tab
2. Har bir push/PR da avtomatik test ishga tushadi
3. Build muvaffaqiyatli bo'lishini tekshiring

## 📦 GitHub Packages (Optional)

Docker images ni GitHub Packages ga push qilish:

```bash
# GitHub Container Registry ga login
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR-USERNAME --password-stdin

# Image ni build qilish
docker build -t ghcr.io/YOUR-USERNAME/xujatech-backend:latest ./backend

# Push qilish
docker push ghcr.io/YOUR-USERNAME/xujatech-backend:latest
```

## 🌟 Repository Sozlamalari

### About Section

1. Repository → "About" (o'ng tomonda)
2. Description qo'shing
3. Website qo'shing (agar mavjud bo'lsa)
4. Topics qo'shing:
   - `pos`
   - `point-of-sale`
   - `inventory-management`
   - `typescript`
   - `react`
   - `nodejs`
   - `mongodb`
   - `uzbekistan`

### Social Preview

1. Repository → "Settings" → "General"
2. "Social preview" → "Edit"
3. Logo yoki screenshot yuklang (1280x640px)

## 📄 License

MIT License allaqachon qo'shilgan (`LICENSE` fayl).

## 🎯 Keyingi Qadamlar

1. ✅ Repository yaratildi
2. ✅ Code push qilindi
3. ✅ README yangilandi
4. ✅ Secrets sozlandi
5. ✅ CI/CD ishlayapti
6. ⏳ Production ga deploy qiling
7. ⏳ Contributors qo'shing
8. ⏳ Documentation yozing

## 📞 Yordam

GitHub bilan bog'liq savollar uchun:
- GitHub Docs: https://docs.github.com
- GitHub Community: https://github.community

---

**Muvaffaqiyatli GitHub setup! 🎉**
