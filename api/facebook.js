import { NextResponse } from 'next/server';
import axios from 'axios';
import moment from 'moment-timezone';

/**
 * دالة لجلب بيانات الدولة بدون الحاجة إلى API Keys
 */
async function getCountryData(country) {
    try {
        console.log(`🔍 جاري جلب بيانات الدولة: ${country}`);

        // جلب إحداثيات الدولة من OpenStreetMap
        const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: country, format: "json", limit: 1 },
        });

        if (!geoRes.data.length) {
            console.error(`⚠️ لم يتم العثور على إحداثيات الدولة: ${country}`);
            return null;
        }

        const { lat, lon, display_name } = geoRes.data[0];

        // جلب معلومات الدولة من RestCountries
        const countryRes = await axios.get(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`
        );

        if (!countryRes.data.length) {
            console.error(`⚠️ لم يتم العثور على بيانات الدولة: ${country}`);
            return null;
        }

        const countryInfo = countryRes.data[0];

        // جلب التوقيت المحلي باستخدام moment-timezone
        let timezone = countryInfo.timezones ? countryInfo.timezones[0] : "غير متوفر";
        let currentTime = "غير متوفر";

        try {
            if (timezone !== "غير متوفر") {
                currentTime = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
            }
        } catch (error) {
            console.warn(`⚠️ توقيت غير صالح للدولة: ${country} - ${timezone}`);
            timezone = "غير متوفر";
        }

        // جلب الطقس الحالي بدون API Key
        const weatherRes = await axios.get(`https://wttr.in/${country}?format=%C+%t`);
        const weatherData = weatherRes.data.split(" ");

        const weather = weatherData[0] || "غير متوفر";
        const temperature = weatherData[1] || "غير متوفر";

        // تجميع البيانات
        const data = {
            name: display_name,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            flag: `https://flagcdn.com/w320/${countryInfo.cca2.toLowerCase()}.png`,
            capital: countryInfo.capital ? countryInfo.capital[0] : "غير متوفر",
            population: countryInfo.population?.toLocaleString() || "غير متوفر",
            area: countryInfo.area?.toLocaleString() + " كم²" || "غير متوفر",
            currency: Object.values(countryInfo.currencies || {})[0]?.name || "غير متوفر",
            language: Object.values(countryInfo.languages || {})[0] || "غير متوفر",
            timezone,
            currentTime,
            weather: { description: weather, temperature },
            callingCode: countryInfo.idd?.root
                ? `${countryInfo.idd.root}${countryInfo.idd.suffixes ? countryInfo.idd.suffixes[0] : ""}`
                : "غير متوفر",
            wiki: `https://en.wikipedia.org/wiki/${encodeURIComponent(country)}`,
            map: `https://www.google.com/maps/@${lat},${lon},6z`,
        };

        console.log(`✅ تم جلب بيانات الدولة: ${country}`);
        return data;

    } catch (error) {
        console.error(`❌ خطأ أثناء جلب بيانات ${country}:`, error.message);
        return null;
    }
}

/**
 * دالة لحساب المسافة بين إحداثيتين باستخدام قانون هافرسين
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2) + " km";
}

/**
 * API Route للمسافة بين البلدين
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const country1 = searchParams.get('country1');
        const country2 = searchParams.get('country2');

        if (!country1 || !country2) {
            return NextResponse.json({
                error: "❌ يرجى تقديم اسم البلدين باستخدام ?country1= و ?country2="
            }, { status: 400 });
        }

        console.log(`🔍 جاري حساب المسافة بين ${country1} و ${country2}`);

        // جلب بيانات الدولتين
        const [data1, data2] = await Promise.all([
            getCountryData(country1),
            getCountryData(country2),
        ]);

        if (!data1 || !data2) {
            return NextResponse.json({
                error: "⚠️ تعذر العثور على بيانات أحد البلدين."
            }, { status: 404 });
        }

        // حساب المسافة بين الدولتين
        const distance = calculateDistance(data1.lat, data1.lon, data2.lat, data2.lon);

        return NextResponse.json({
            country1: data1,
            country2: data2,
            distance,
        });

    } catch (error) {
        console.error("❌ خطأ أثناء حساب المسافة:", error.message);
        return NextResponse.json({
            error: "❌ حدث خطأ داخلي. حاول مرة أخرى لاحقًا."
        }, { status: 500 });
    }
}
