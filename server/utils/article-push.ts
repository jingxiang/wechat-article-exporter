import { getArticleList } from '~/apis';
import { ARTICLE_PUSH_CONFIG } from '~/config';
import { getAllInfo } from '~/store/info';

let pushTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let monitorTimer: NodeJS.Timeout | null = null;
let lastActiveTime = 0;

interface PushArticle {
    title: string;
    link: string;
    cover: string;
    digest: string;
    create_time: number;
    update_time: number;
    // 添加公众号信息
    account: {
        fakeid: string;
        nickname?: string;
    };
}

/**
 * 启动文章推送任务监控
 * @param token 登录token
 */
export function startPushMonitor(token: string) {
    if (monitorTimer) {
        console.log('推送任务监控已在运行中');
        return;
    }

    console.log('启动推送任务监控');
    
    // 立即检查一次
    checkPushTask(token);

    // 每30秒检查一次推送任务是否正常运行
    monitorTimer = setInterval(() => {
        checkPushTask(token);
    }, 30 * 1000);
}

/**
 * 停止文章推送任务监控
 */
export function stopPushMonitor() {
    if (monitorTimer) {
        clearInterval(monitorTimer);
        monitorTimer = null;
    }
    console.log('停止推送任务监控');
}

/**
 * 检查推送任务状态
 */
function checkPushTask(token: string) {
    const now = Date.now();
    
    // 如果任务未运行或者最后活动时间超过2个推送间隔，则重新启动任务
    if (!isRunning || (now - lastActiveTime > ARTICLE_PUSH_CONFIG.INTERVAL * 60 * 1000 * 2)) {
        console.log('检测到推送任务未运行或已停止，正在重新启动...');
        stopArticlePushTask(); // 确保清理旧的任务
        startArticlePushTask(token);
    }
}

/**
 * 启动文章推送任务
 * @param token 登录token
 */
export function startArticlePushTask(token: string) {
    if (isRunning) {
        console.log('文章推送任务已在运行中');
        return;
    }

    isRunning = true;
    lastActiveTime = Date.now();
    console.log('启动文章推送任务');

    // 立即执行一次
    pushLatestArticles(token);

    // 设置定时任务
    pushTimer = setInterval(() => {
        pushLatestArticles(token);
    }, ARTICLE_PUSH_CONFIG.INTERVAL * 60 * 1000);
}

/**
 * 停止文章推送任务
 */
export function stopArticlePushTask() {
    if (pushTimer) {
        clearInterval(pushTimer);
        pushTimer = null;
    }
    isRunning = false;
    console.log('停止文章推送任务');
}

/**
 * 推送最新文章
 */
async function pushLatestArticles(token: string) {
    try {
        lastActiveTime = Date.now(); // 更新最后活动时间
        
        // 获取所有缓存的公众号信息
        const accounts = await getAllInfo();
        if (accounts.length === 0) {
            console.log('没有缓存的公众号信息');
            return;
        }

        const allArticles: PushArticle[] = [];

        // 获取每个公众号的最新文章
        for (const account of accounts) {
            try {
                const [articles] = await getArticleList(account.fakeid, token, 0, '');
                if (articles.length > 0) {
                    // 只取最新的10篇
                    const latestArticles = articles.slice(0, ARTICLE_PUSH_CONFIG.LIMIT);
                    
                    // 转换文章格式并添加公众号信息
                    const pushArticles: PushArticle[] = latestArticles.map(article => ({
                        title: article.title,
                        link: article.link,
                        cover: article.cover,
                        digest: article.digest,
                        create_time: article.create_time,
                        update_time: article.update_time,
                        account: {
                            fakeid: account.fakeid,
                            nickname: account.nickname
                        }
                    }));
                    
                    allArticles.push(...pushArticles);
                }
            } catch (error) {
                console.error(`获取公众号 ${account.nickname || account.fakeid} 的文章时出错:`, error);
                continue;
            }
        }

        if (allArticles.length === 0) {
            console.log('没有新文章需要推送');
            return;
        }

        // 按时间排序，最新的在前
        allArticles.sort((a, b) => b.create_time - a.create_time);

        // 推送文章
        const response = await fetch(ARTICLE_PUSH_CONFIG.PUSH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(allArticles)
        });

        if (!response.ok) {
            throw new Error(`推送失败: ${response.statusText}`);
        }

        console.log(`成功推送 ${allArticles.length} 篇文章，来自 ${accounts.length} 个公众号`);
    } catch (error) {
        console.error('推送文章时出错:', error);
    }
} 