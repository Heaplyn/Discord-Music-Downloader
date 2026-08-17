import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const webCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('web')
        .setDescription('Web search and information utilities.')
        .addSubcommand(sub => sub.setName('weather').setDescription('Check weather for a city').addStringOption(opt => opt.setName('city').setDescription('City name').setRequired(true)))
        .addSubcommand(sub => sub.setName('crypto').setDescription('Check cryptocurrency price').addStringOption(opt => opt.setName('coin').setDescription('Coin symbol/name (e.g. BTC, Ethereum)').setRequired(true)))
        .addSubcommand(sub => sub.setName('stock').setDescription('Check stock price').addStringOption(opt => opt.setName('symbol').setDescription('Stock symbol (e.g. AAPL, TSLA)').setRequired(true)))
        .addSubcommand(sub => sub.setName('news').setDescription('Get latest headlines'))
        .addSubcommand(sub => sub.setName('google').setDescription('Get a Google search link').addStringOption(opt => opt.setName('query').setDescription('Search query').setRequired(true)))
        .addSubcommand(sub => sub.setName('fetch').setDescription('Summarize a webpage (simplified)').addStringOption(opt => opt.setName('url').setDescription('URL to fetch').setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply();

        try {
            switch (subcommand) {
                case 'weather': {
                    const city = interaction.options.getString('city', true);
                    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
                    if (!response.ok) throw new Error('wttr.in error');
                    const data = await response.json() as any;

                    const current = data.current_condition[0];
                    const weatherDesc = current.weatherDesc[0].value;
                    const tempC = current.temp_C;
                    const tempF = current.temp_F;
                    const humidity = current.humidity;
                    const windSpeed = current.windspeedKmph;

                    const embed = new EmbedBuilder()
                        .setTitle(`🌤️ Weather in ${city}`)
                        .setColor('#0099ff')
                        .addFields(
                            { name: 'Condition', value: weatherDesc, inline: true },
                            { name: 'Temperature', value: `${tempC}°C / ${tempF}°F`, inline: true },
                            { name: 'Humidity', value: `${humidity}%`, inline: true },
                            { name: 'Wind Speed', value: `${windSpeed} km/h`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'wttr.in' });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'crypto': {
                    const coinInput = interaction.options.getString('coin', true).toLowerCase().trim();
                    
                    const coinMap: { [key: string]: string } = {
                        btc: 'bitcoin',
                        eth: 'ethereum',
                        sol: 'solana',
                        doge: 'dogecoin',
                        ada: 'cardano',
                        xrp: 'ripple',
                        dot: 'polkadot',
                        matic: 'polygon',
                        link: 'chainlink',
                        ltc: 'litecoin',
                        shib: 'shiba-inu'
                    };

                    const coinId = coinMap[coinInput] || coinInput;

                    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
                    if (!response.ok) throw new Error('CoinGecko error');
                    const data = await response.json() as any;

                    if (!data[coinId]) {
                        await interaction.editReply(`❌ Could not find price data for **${coinInput}**.`);
                        return;
                    }

                    const price = data[coinId].usd;
                    const change = data[coinId].usd_24h_change;
                    
                    const coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1);
                    const changeText = change !== undefined ? `${change >= 0 ? '📈 +' : '📉 '}${change.toFixed(2)}%` : 'N/A';
                    const color = change >= 0 ? '#2ecc71' : '#e74c3c';

                    const embed = new EmbedBuilder()
                        .setTitle(`🪙 ${coinName} Price Status`)
                        .setColor(color)
                        .addFields(
                            { name: 'Current Price', value: `$${price.toLocaleString()}`, inline: true },
                            { name: '24h Change', value: changeText, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by CoinGecko' });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'stock': {
                    const symbol = interaction.options.getString('symbol', true).toUpperCase();
                    
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    if (!response.ok) {
                        await interaction.editReply(`❌ Failed to retrieve stock data for **${symbol}**.`);
                        return;
                    }

                    const data = await response.json() as any;
                    const result = data.chart?.result?.[0];
                    if (!result) {
                        await interaction.editReply(`❌ No stock data found for **${symbol}**.`);
                        return;
                    }

                    const meta = result.meta;
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose;
                    const currency = meta.currency || 'USD';

                    const change = price - prevClose;
                    const percentChange = (change / prevClose) * 100;
                    const changeText = `${change >= 0 ? '📈 +' : '📉 '}${change.toFixed(2)} (${percentChange.toFixed(2)}%)`;
                    const color = change >= 0 ? '#2ecc71' : '#e74c3c';

                    const embed = new EmbedBuilder()
                        .setTitle(`📈 Stock Price: ${symbol}`)
                        .setColor(color)
                        .addFields(
                            { name: 'Current Price', value: `${price.toLocaleString()} ${currency}`, inline: true },
                            { name: 'Change', value: changeText, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Yahoo Finance' });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'news': {
                    const response = await fetch('https://saurav.tech/NewsAPI/top-headlines/category/general/us.json');
                    if (!response.ok) throw new Error('NewsAPI mirror error');
                    const data = await response.json() as any;

                    if (!data.articles || data.articles.length === 0) {
                        await interaction.editReply('❌ No news articles found.');
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('📰 Top US Headlines')
                        .setColor('#9b59b6')
                        .setTimestamp();

                    const articles = data.articles.slice(0, 5);
                    let newsText = '';
                    for (let i = 0; i < articles.length; i++) {
                        const art = articles[i];
                        newsText += `**${i + 1}. [${art.title}](${art.url})**\n*Source: ${art.source.name}*\n\n`;
                    }

                    embed.setDescription(newsText);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'google': {
                    const query = interaction.options.getString('query', true);
                    await interaction.editReply(`🔍 **Google Search:** [Click here to search for "${query}"](https://www.google.com/search?q=${encodeURIComponent(query)})`);
                    break;
                }

                case 'fetch': {
                    const url = interaction.options.getString('url', true);
                    await interaction.editReply(`🌐 **Web Fetch:** Due to security and complexity, full scraping is handled via the Jarvis PC app. Here is your link: [${url}](${url})`);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in /web ${subcommand}:`, error);
            await interaction.editReply('❌ There was an error executing this command!');
        }
    }
};
