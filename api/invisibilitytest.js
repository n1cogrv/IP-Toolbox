import { get } from 'https';

// 如果长度不等于 28 且不是字母与数字的组合，则返回 false
function isValidUserID(userID) {
    return userID.length === 28 && /^[a-zA-Z0-9]+$/.test(userID);
}

export default (req, res) => {

    // 限制只能从指定域名访问
    const allowedDomains = ['localhost', ...(process.env.ALLOWED_DOMAINS || '').split(',')];
    const referer = req.headers.referer;

    if (referer) {
        const domain = new URL(referer).hostname;
        if (!allowedDomains.includes(domain)) {
            return res.status(403).json({ error: 'Access denied' });
        }
    } else {
        return res.status(403).json({ error: 'What are you doing?' });
    }

    const id = req.query.id;
    if (!id) {
        return res.status(400).json({ error: 'No ID provided' });
    }

    // 检查 IP 地址是否合法
    if (!isValidUserID(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    const apikey = process.env.INVISIBILITY_TEST_API_KEY;
    const url = new URL(`https://proxydetect.ipcheck.ing/getinfo/${id}?apikey=${apikey}`);

    get(url, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                res.json(result);
            } catch (e) {
                res.status(500).json({ error: 'Error parsing JSON' });
            }
        });
    }).on('error', (e) => {
        res.status(500).json({ error: e.message });
    });
};