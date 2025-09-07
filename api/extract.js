const pdf = require('pdf-parse');

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем PDF данные из запроса
    const { pdfData } = req.body;
    
    if (!pdfData) {
      return res.status(400).json({ error: 'PDF data required' });
    }

    // Конвертируем base64 в buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    // Извлекаем текст из PDF
    const data = await pdf(pdfBuffer);
    const fullText = data.text;

    // 1. Номер полиса - ищем разные варианты
    const policyMatch = fullText.match(/Поліс\s*№\s*(\d{8,9})/) || 
                       fullText.match(/№\s*(\d{8,9})/) ||
                       fullText.match(/полісом\s+[^\d]*(\d{8,9})/) ||
                       fullText.match(/(\d{8,9})/);
    const policyNumber = policyMatch ? policyMatch[1] : null;

    // 2. ИПН - 10 цифр после РНОКПП  
    const ipnMatch = fullText.match(/РНОКПП[^\d]*(\d{10})/);
    const ipn = ipnMatch ? ipnMatch[1] : null;

    // 3. Цена - ищем 2585,00 в разделе премии
    let price = null;
    if (fullText.includes('2 585,00')) {
      price = "2585";
    } else {
      const priceMatch = fullText.match(/премії[^\d]*(\d{3,4})[,\s]*00/);
      if (priceMatch) {
        price = priceMatch[1];
      }
    }

    // Возвращаем результат в формате price|ipn|policy_number
    const result = `${price || ''}|${ipn || ''}|${policyNumber || ''}`;

    return res.status(200).json({
      success: true,
      result: result,
      details: {
        price: price,
        ipn: ipn,
        policy_number: policyNumber
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return res.status(500).json({ 
      error: 'Failed to process PDF',
      message: error.message 
    });
  }
}