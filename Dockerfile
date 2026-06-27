# ---------- Stage 1: ติดตั้ง dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# ใช้ npm ci ถ้ามี lockfile ไม่งั้น fallback เป็น npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---------- Stage 2: build แอป ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# สร้าง production build แบบ standalone (กำหนดไว้ใน next.config.mjs)
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# สร้าง user ที่ไม่ใช่ root เพื่อความปลอดภัย
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# คัดลอกผลลัพธ์ standalone (มี server.js + node_modules ที่จำเป็น)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# standalone trace บางทีไม่ดึง 'postgres' เข้ามา (เป็น zero-dependency) จึง copy ตรง ๆ
# จำเป็นทั้งกับสคริปต์ migration และ API routes ที่ต่อ database ตอน runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

# คัดลอกไฟล์ migration + สคริปต์ + entrypoint
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# กันปัญหา line ending (CRLF) เวลา build ข้ามแพลตฟอร์ม Windows/Mac/Linux
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
