# Design PMO - Project TODO

## Phase 1: Database Schema & Backend Setup
- [x] إنشاء جداول قاعدة البيانات (projects, staff, budgetLabor, budgetExpenses, timeLogs, expenses, payments)
- [x] إضافة علاقات بين الجداول والمستخدمين
- [x] تطبيق db:push للمايجريشن

## Phase 2: Backend API (tRPC Procedures)
- [x] إنشاء procedures للمشاريع (create, list, get, update, delete)
- [x] إنشاء procedures للموظفين (create, list, delete)
- [x] إنشاء procedures للميزانيات (labor & expenses)
- [x] إنشاء procedures لتسجيل الوقت والمصروفات
- [x] إنشاء procedures للدفعات والـ VOs
- [x] إنشاء Gemini AI endpoint آمن في Backend

## Phase 3: Frontend Components Structure
- [x] إعداد التصميم العام (colors, fonts, theme)
- [x] إنشاء Header مع Navigation
- [x] إنشاء صفحة قائمة المشاريع (Projects List)
- [x] إنشاء صفحة تفاصيل المشروع (Project Detail)
- [x] إضافة لوجو الشركة

## Phase 4: Core Features Implementation
- [x] Dashboard: KPIs و EVM metrics
- [x] Budgeting: إدخال التقديرات الأولية (Labor + Expenses)
- [x] Time & Expenses: تسجيل الساعات والمصروفات
- [x] Payments: إدارة الدفعات والتدفق النقدي
- [x] Settings: إعدادات المشروع والموظفين
- [x] نظام التوقف (Stoppage) وحساب الخسائر

## Phase 5: Advanced Features
- [ ] تكامل Gemini AI للتقارير والتصنيف (تم إلغاؤه بطلب المستخدم)
- [x] نظام الحفظ التلقائي في قاعدة البيانات
- [x] دعم اللغتين (العربية/الإنجليزية) مع RTL/LTR
- [x] تحليل الانحراف (المقدر vs الفعلي)
- [x] توزيع التكلفة (الرياض vs القاهرة)

## Phase 6: Testing & Deployment
- [x] اختبار جميع العمليات CRUD (vitest - 16 اختبار)
- [x] اختبار نظام المصادقة
- [x] اختبار الحسابات المالية و EVM
- [x] اختبار تبديل اللغة
- [x] إنشاء Checkpoint نهائي
- [ ] نشر الموقع (يتم من خلال زر Publish في واجهة المستخدم)

## ملاحظات
- تم إلغاء صفحة إنشاء مشروع جديد بناءً على طلب المستخدم
- تم إلغاء AI Integration بناءً على طلب المستخدم

## تحديث: طلب المستخدم
- [x] حذف المشاريع التجريبية من قاعدة البيانات (الاحتفاظ فقط بمشروع JKP)
- [x] إلغاء نظام تسجيل الدخول وجعل الموقع متاح مباشرة بدون مصادقة
- [x] توجيه الصفحة الرئيسية مباشرة لمشروع JKP بدون صفحة قائمة المشاريع
