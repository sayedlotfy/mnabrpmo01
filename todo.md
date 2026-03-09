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

## تحديث: نظام إدارة المحفظة الكامل
- [x] تحديث database schema - إضافة جدول appUsers (PIN system) وحقل phase للمشاريع
- [x] إنشاء نظام PIN للمستخدمين (مدير محفظة / مدير مشروع)
- [x] إنشاء شاشة اختيار المستخدم وإدخال PIN (PinLogin)
- [x] إنشاء AppUserContext لإدارة الجلسة
- [x] إنشاء Portfolio Dashboard لمدير المحفظة
  - [x] KPIs: إجمالي الإيرادات، المحصّل، CPI، الربحية، المشاريع النشطة والمتعثرة
  - [x] Cash Flow Chart شهري وربع سنوي
  - [x] توزيع المراحل (Pie Chart)
  - [x] جدول أداء المشاريع مع تصفية حسب المدير
  - [x] تنبيهات ذكية للمشاريع المتعثرة
- [x] إنشاء صفحة إنشاء مشروع جديد (CreateProject)
- [x] إضافة حقل مرحلة المشروع (Phase) في صفحة التفاصيل
- [x] تصحيح حساب قيمة العقد تلقائياً من الدفعات + أوامر التغيير
- [x] إضافة تصدير PDF للتقارير
- [x] اختبارات vitest للنظام الجديد (22 اختبار - جميعها نجحت)
- [x] إنشاء Checkpoint نهائي

## تحديث: طلبات جديدة (مارس 2026)
- [x] إصلاح مشكلة الخطوط العربية عند الطباعة (Print CSS - Noto Naskh Arabic)
- [x] إصلاح تصدير PDF ليدعم الخطوط العربية (jsPDF + Amiri font + bidi algorithm)
- [x] إضافة قسم إدارة المستخدمين في Portfolio Dashboard
  - [x] إضافة مهندس جديد (اسم + PIN 4 أرقام) - AddUserModal
  - [x] تعديل PIN المهندسين من قِبل مدير المحفظة فقط - adminUpdatePin
  - [x] حذف المهندسين من قِبل مدير المحفظة فقط
  - [x] منع المهندس من تعديل PIN الخاص به
- [x] مراجعة وإكمال الترجمة الثنائية (AR/EN) في جميع الصفحات
- [x] تعيين العربية كلغة افتراضية في جميع الصفحات والـ contexts

## تحديث: طلبات مارس 2026 - الدفعة الثانية
- [x] إصلاح ترتيب الكلمات العربية عند الطباعة (unicode-bidi: plaintext على جميع العناصر)
- [x] شاشة إنشاء مشروع جديد: اسم مدير المشروع يظهر تلقائياً ويكون للقراءة فقط لمدير المشروع
- [x] شاشة إنشاء مشروع جديد: قائمة dropdown لاختيار مدير المشروع لمدير المحفظة
- [x] منسق المشروع حقل نصي حر (دائماً)
- [x] إضافة أيقونة الإشعارات في أعلى الشاشة مع قائمة منسدلة (في PortfolioDashboard و ProjectsList)

## تحديث: مارس 2026 - الدفعة الثالثة
- [x] تعديل اسم المستخدم الرئيسي إلى "السيد لطفي" (بدون لقب) - تحديث قاعدة البيانات
- [x] إضافة شريط آخر تحديث (LastUpdatedBanner) بالتاريخين الهجري والميلادي في جميع الصفحات
- [x] إدراج 10 مشاريع حقيقية من ملف Excel في قاعدة البيانات (مع الدفعات الحقيقية)
- [x] تطبيق ثيم Liquid Glass (iOS 26) مع دعم الوضع الفاتح والداكن (ThemeToggle + CSS variables)

## تحديث: مارس 2026 - نظام سجل المدة
- [x] تحديث قاعدة البيانات: إضافة جدول projectEvents (eventType, eventDate, reason, recordedBy)
- [x] إضافة حقلي isPaused و pauseStartDate لجدول المشاريع
- [x] بناء مكتبة workingDays.ts (أحد-خميس، إجازات سعودية 2024-2027)
- [x] تحديث tRPC: togglePause مع سبب إلزامي (min 5 أحرف) + حفظ الحدث في projectEvents
- [x] بناء DurationLogTab مع مؤشرات الأيام (إجمالي/مستهلك/متبقي/توقف) + تاريخ هجري وميلادي
- [x] دمج DurationLogTab في ProjectDetail كتاب "الجدول الزمني والمدة"
- [ ] اختبار vitest لمكتبة workingDays (معلق)

## تحديث: مارس 2026 - الأرقام اللاتينية وعداد الأيام
- [ ] فرض الأرقام اللاتينية (0-9) في كل مكان بالواجهتين العربية والإنجليزية (font-feature-settings + CSS)
- [ ] نقل عداد الأيام وزر الإيقاف/التشغيل من Dashboard إلى تاب "الجدول الزمني والمدة"

## تحديث: مارس 2026 - الخطوط والأرقام
- [x] IBM Plex Arabic للعربية + IBM Plex Sans للإنجليزية في الواجهة
- [x] Scheherazade New للطباعة والـ PDF فقط (دعم Bidi كامل)
- [x] فرض الأرقام اللاتينية (0-9) في كل مكان (font-variant-numeric: lining-nums tabular-nums + font-feature-settings)
- [x] نقل عداد الأيام وزر الإيقاف/التشغيل من Dashboard إلى تاب "الجدول الزمني والمدة" (بطاقة حالة مبسطة في Dashboard)

## تحديث: مارس 2026 - المقترحات الثلاثة
- [x] تمديد تاريخ الانتهاء تلقائياً بأيام التوقف (extendEndDate procedure + نافذة تأكيد + تسجيل حدث extension)
- [x] فلتر بحث في قائمة المشاريع (بالاسم + الكود + المدير + المنسق) مع زر مسح
- [x] تصدير سجل المدة في PDF (jsPDF + Amiri + جدول الأحداث + مؤشرات الأيام بالتاريخين)

## تحديث: مارس 2026 - الدفعة الرابعة
- [ ] مراحل المشروع: جدول projectPhases في قاعدة البيانات + CRUD في تاب الإعدادات
- [ ] تصدير Cash Flow ربع سنوي/نصف سنوي لـ PDF وExcel من Portfolio Dashboard
- [ ] تعديل أسماء المستخدمين (مدير المحفظة + مدراء المشاريع) في تاب إدارة المستخدمين
- [ ] نقل مشروع نشط من مدير مشروع لآخر (من Portfolio Dashboard)
- [ ] التحقق من تسجيل التواريخ الهجرية والميلادية في سجل المدة (زر الإيقاف/التشغيل)

## تحديث: مارس 2026 - الدفعة الخامسة
- [x] تاب المطالبات في Portfolio Dashboard (الدفعات المستحقة الإصدار من المالية)
- [x] تاب المديونيات في Portfolio Dashboard (الفواتير الصادرة وغير المسددة)
- [x] تصدير تاب المطالبات بـ PDF وExcel
- [x] تصدير تاب المديونيات بـ PDF وExcel

## تحديث: مارس 2026 - نظام أرشفة المشاريع
- [x] إضافة حقل isArchived (boolean) وarchivedAt (timestamp) وarchivedBy في schema
- [x] تطبيق db:push للمايجريشن
- [x] إضافة procedures: archiveProject, unarchiveProject, deleteProject (بمصادقة مزدوجة)
- [x] تحديث Portfolio Dashboard: زر أرشفة + إخفاء المؤرشف من الجداول والـ KPIs
- [x] إضافة تاب/قسم "المؤرشف" في Portfolio Dashboard لعرض المشاريع المؤرشفة
- [x] تحديث Project Detail: شريط تنبيه "مؤرشف" + زر إعادة تنشيط (مدير المحفظة فقط) + زر حذف بمصادقة مزدوجة
- [x] مصادقة مزدوجة للحذف: PIN مدير المشروع + PIN مدير المحفظة

## تحديث: مارس 2026 - بند الدفعات الداخلية
- [x] إضافة جدول internalTransfers في schema (recipient, department, amount, date, description, status)
- [x] تطبيق db:push للمايجريشن
- [x] إضافة procedures: CRUD للدفعات الداخلية
- [x] إضافة قسم "الدفعات الداخلية" في تاب المصاريف بـ Project Detail
- [x] ربط مجموع الدفعات الداخلية بحسابات التكلفة الإجمالية والربحية في KPIs
- [ ] تحديث تصدير PDF ليشمل الدفعات الداخلية

## تحديث: مارس 2026 - دمج الدفعات الداخلية في سجل المصاريف
- [ ] إضافة حقل recipient وdepartment لجدول expenses في schema
- [ ] تطبيق db:push للمايجريشن
- [ ] تحديث procedure expenses.create لقبول recipient وdepartment
- [ ] إضافة "دفعات لأقسام داخلية" كفئة في dropdown المصاريف
- [ ] إظهار recipient وdepartment في جدول سجل المصاريف
- [ ] إزالة البطاقة المنفصلة للدفعات الداخلية وجدول internalTransfers
- [ ] إبقاء الحسابات المالية صحيحة (totalBurn يشمل الدفعات الداخلية)

## تحديث: مارس 2026 - أرشفة + تعديل الاسم + نقل المشروع
- [x] db.ts: archiveProject, unarchiveProject, getAllProjects (يستثني المؤرشف), getArchivedProjects
- [x] routers.ts: projects.archive, projects.unarchive, projects.listArchived, appUsers.updateName
- [x] Portfolio Dashboard: زر أرشفة على كل مشروع (مدير المحفظة فقط) + تبويب "المؤرشف"
- [x] Portfolio Dashboard: نقل مشروع من مدير لآخر (dialog اختيار مدير جديد)
- [x] Project Detail: شريط تنبيه أصفر عند الأرشفة + زر إعادة تنشيط
- [x] Project Detail: زر حذف بمصادقة مزدوجة (PIN مدير المشروع + PIN مدير المحفظة)
- [x] تاب إدارة المستخدمين: تعديل الاسم inline (click to edit)

## تحديث: مارس 2026 - مستحقات أقسام داخلية متعاونة
- [ ] إزالة قسم "الدفعات الداخلية" المنفصل من واجهة ProjectDetail
- [ ] إضافة فئة "مستحقات أقسام داخلية متعاونة" في dropdown فئات المصروفات
- [ ] إضافة حقل department (اختياري) في جدول expenses لتحديد القسم المستفيد
- [ ] تحديث schema وdb:push
- [ ] تحديث LanguageContext بالترجمات الجديدة
