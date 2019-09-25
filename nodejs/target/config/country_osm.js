'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../modules/Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const countryDistrictTree = {
  'Afghanistan': {
    zhName: '阿富汗',
    enName: 'Afghanistan',
    iso: 'AFG',
    level: 1,
    osmRelationIds: [303427],
    mfwId: 17354
  },
  'Albania': {
    zhName: '阿尔巴尼亚',
    enName: 'Albania',
    iso: 'ALB',
    level: 1,
    osmRelationIds: [53292],
    mfwId: 17355
  },
  'Algeria': {
    zhName: '阿尔及利亚',
    enName: 'Algeria',
    iso: 'DZA',
    level: 1,
    osmRelationIds: [192756],
    mfwId: 17406
  },
  'Andorra': {
    zhName: '安道尔',
    enName: 'Andorra',
    iso: 'AND',
    level: 1,
    osmRelationIds: [9407],
    mfwId: 17352
  },
  'Angola': {
    zhName: '安哥拉',
    enName: 'Angola',
    iso: 'AGO',
    level: 1,
    osmRelationIds: [195267],
    mfwId: 17357
  },
  'Antigua and Barbuda': {
    zhName: '安提瓜 巴布达',
    enName: 'Antigua and Barbuda',
    iso: 'ATG',
    level: 1,
    osmRelationIds: [536900],
    mfwId: 17359
  },
  'Argentina': {
    zhName: '阿根廷',
    enName: 'Argentina',
    iso: 'ARG',
    level: 1,
    osmRelationIds: [286393],
    mfwId: 17360
  },
  'Armenia': {
    zhName: '亚美尼亚',
    enName: 'Armenia',
    iso: 'ARM',
    level: 1,
    osmRelationIds: [364066],
    mfwId: 17361
  },
  'Austria': {
    zhName: '奥地利',
    enName: 'Austria',
    iso: 'AUT',
    level: 1,
    osmRelationIds: [16239],
    mfwId: 17363
  },
  'Azerbaijan': {
    zhName: '阿塞拜疆',
    enName: 'Azerbaijan',
    iso: 'AZE',
    level: 1,
    osmRelationIds: [364110],
    mfwId: 17364
  },
  'Bahamas': {
    zhName: '巴哈马',
    enName: 'Bahamas',
    iso: 'BHS',
    level: 1,
    osmRelationIds: [547469],
    mfwId: 17366
  },
  'Bahrain': {
    zhName: '巴林',
    enName: 'Bahrain',
    iso: 'BHR',
    level: 1,
    osmRelationIds: [378734],
    mfwId: 17367
  },
  'Bangladesh': {
    zhName: '孟加拉国',
    enName: 'Bangladesh',
    iso: 'BGD',
    level: 1,
    osmRelationIds: [184640],
    mfwId: 17368
  },
  'Barbados': {
    zhName: '巴巴多斯',
    enName: 'Barbados',
    iso: 'BRB',
    level: 1,
    osmRelationIds: [547511],
    mfwId: 17369
  },
  'Belarus': {
    zhName: '白俄罗斯',
    enName: 'Belarus',
    iso: 'BLR',
    level: 1,
    osmRelationIds: [59065],
    mfwId: 17370
  },
  'Belgium': {
    zhName: '比利时',
    enName: 'Belgium',
    iso: 'BEL',
    level: 1,
    osmRelationIds: [52411],
    mfwId: 17372
  },
  'Belize': {
    zhName: '伯利兹',
    enName: 'Belize',
    iso: 'BLZ',
    level: 1,
    osmRelationIds: [287827],
    mfwId: 17371
  },
  'Benin': {
    zhName: '贝宁',
    enName: 'Benin',
    iso: 'BEN',
    level: 1,
    osmRelationIds: [192784],
    mfwId: 17373
  },
  'Bhutan': {
    zhName: '不丹',
    enName: 'Bhutan',
    iso: 'BTN',
    level: 1,
    osmRelationIds: [184629],
    mfwId: 17375
  },
  'Bolivia': {
    zhName: '玻利维亚',
    enName: 'Bolivia',
    iso: 'BOL',
    level: 1,
    osmRelationIds: [252645],
    mfwId: 17376
  },
  'Bosnia and Herzegovina': {
    zhName: '波斯尼亚 黑塞哥维纳',
    enName: 'Bosnia and Herzegovina',
    iso: 'BIH',
    level: 1,
    osmRelationIds: [2528142],
    mfwId: 17377
  },
  'Botswana': {
    zhName: '博茨瓦纳',
    enName: 'Botswana',
    iso: 'BWA',
    level: 1,
    osmRelationIds: [1889339],
    mfwId: 17378
  },
  'Brazil': {
    zhName: '巴西',
    enName: 'Brazil',
    iso: 'BRA',
    level: 1,
    osmRelationIds: [59470],
    mfwId: 17380
  },
  'Brunei': {
    zhName: '文莱达鲁萨兰国',
    enName: 'Brunei',
    iso: 'BRN',
    level: 1,
    osmRelationIds: [2103120],
    mfwId: 17381
  },
  'Bulgaria': {
    zhName: '保加利亚',
    enName: 'Bulgaria',
    iso: 'BGR',
    level: 1,
    osmRelationIds: [186382],
    mfwId: 17382
  },
  'Burkina Faso': {
    zhName: '布基纳法索',
    enName: 'Burkina Faso',
    iso: 'BFA',
    level: 1,
    osmRelationIds: [192783],
    mfwId: 17383
  },
  'Burundi': {
    zhName: '布隆迪',
    enName: 'Burundi',
    iso: 'BDI',
    level: 1,
    osmRelationIds: [195269],
    mfwId: 17384
  },
  "Côte d'Ivoire": {
    zhName: '科特迪瓦',
    enName: "Côte d'Ivoire",
    iso: 'CIV',
    level: 1,
    osmRelationIds: [192779],
    mfwId: 17397
  },
  'Cabo Verde': {
    zhName: '佛得角',
    enName: 'Cabo Verde',
    iso: 'CPV',
    level: 1,
    osmRelationIds: [535774],
    mfwId: 17387
  },
  'Cambodia': {
    zhName: '柬埔寨',
    enName: 'Cambodia',
    iso: 'KHM',
    level: 1,
    osmRelationIds: [49898],
    mfwId: 17452
  },
  'Cameroon': {
    zhName: '喀麦隆',
    enName: 'Cameroon',
    iso: 'CMR',
    level: 1,
    osmRelationIds: [192830],
    mfwId: 17385
  },
  'Canada': {
    zhName: '加拿大',
    enName: 'Canada',
    iso: 'CAN',
    level: 1,
    osmRelationIds: [1428125],
    mfwId: 17386
  },
  'Central African Republic': {
    zhName: '中非共和国',
    enName: 'Central African Republic',
    iso: 'CAF',
    level: 1,
    osmRelationIds: [192790],
    mfwId: 17388
  },
  'Chad': {
    zhName: '查德',
    enName: 'Chad',
    iso: 'TCD',
    level: 1,
    osmRelationIds: [2361304],
    mfwId: 17532
  },
  'Chile': {
    zhName: '智利',
    enName: 'Chile',
    iso: 'CHL',
    level: 1,
    osmRelationIds: [167454],
    mfwId: 17389
  },
  // 'China': {
  //   zhName: '中华人民共和国',
  //   enName: 'China',
  //   iso: 'CHN',
  //   osmRelationIds: [270056, 449220] // 中国和台湾(TW TW TWN 158)
  // },
  'Colombia': {
    zhName: '哥伦比亚',
    enName: 'Colombia',
    iso: 'COL',
    level: 1,
    osmRelationIds: [120027],
    mfwId: 17392
  },
  'Comoros': {
    zhName: '科摩罗',
    enName: 'Comoros',
    iso: 'COM',
    level: 1,
    osmRelationIds: [535790],
    mfwId: 17453
  },
  'Congo (Congo-Brazzaville)': {
    zhName: '刚果共和国',
    enName: 'Congo (Congo-Brazzaville)',
    iso: 'COG',
    level: 1,
    osmRelationIds: [192794],
    mfwId: 17394
  },
  'Costa Rica': {
    zhName: '哥斯达黎加',
    enName: 'Costa Rica',
    iso: 'CRI',
    level: 1,
    osmRelationIds: [287667],
    mfwId: 17396
  },
  'Croatia': {
    zhName: '克罗地亚',
    enName: 'Croatia',
    iso: 'HRV',
    level: 1,
    osmRelationIds: [214885],
    mfwId: 17432
  },
  'Cuba': {
    zhName: '古巴',
    enName: 'Cuba',
    iso: 'CUB',
    level: 1,
    osmRelationIds: [307833],
    mfwId: 17398
  },
  'Cyprus': {
    zhName: '塞浦路斯',
    enName: 'Cyprus',
    iso: 'CYP',
    level: 1,
    osmRelationIds: [307787],
    mfwId: 17399
  },
  'Czechia': {
    zhName: '捷克',
    enName: 'Czechia',
    iso: 'CZE',
    level: 1,
    osmRelationIds: [51684],
    mfwId: 17400
  },
  'Democratic Republic of the Congo': {
    zhName: '刚果民主共和国',
    enName: 'Democratic Republic of the Congo',
    iso: 'COD',
    level: 1,
    osmRelationIds: [192795],
    mfwId: 17574
  },
  'Djibouti': {
    zhName: '吉布提',
    enName: 'Djibouti',
    iso: 'DJI',
    level: 1,
    osmRelationIds: [192801],
    mfwId: 17402
  },
  'Dominica': {
    zhName: '多米尼克',
    enName: 'Dominica',
    iso: 'DMA',
    level: 1,
    osmRelationIds: [307823],
    mfwId: 17570
  },
  'Dominican Republic': {
    zhName: '多明尼加共和国',
    enName: 'Dominican Republic',
    iso: 'DOM',
    level: 1,
    osmRelationIds: [307828],
    mfwId: 17405
  },
  'Ecuador': {
    zhName: '厄瓜多尔',
    enName: 'Ecuador',
    iso: 'ECU',
    level: 1,
    osmRelationIds: [108089],
    mfwId: 17407
  },
  'Egypt': {
    zhName: '埃及',
    enName: 'Egypt',
    iso: 'EGY',
    level: 1,
    osmRelationIds: [1473947],
    mfwId: 17408
  },
  'El Salvador': {
    zhName: '萨尔瓦多',
    enName: 'El Salvador',
    iso: 'SLV',
    level: 1,
    osmRelationIds: [1520612],
    mfwId: 17515
  },
  'Equatorial Guinea': {
    zhName: '赤道几内亚',
    enName: 'Equatorial Guinea',
    iso: 'GNQ',
    level: 1,
    osmRelationIds: [192791],
    mfwId: 17418
  },
  'Eritrea': {
    zhName: '厄立特里亚',
    enName: 'Eritrea',
    iso: 'ERI',
    level: 1,
    osmRelationIds: [296961],
    mfwId: 17573
  },
  'Estonia': {
    zhName: '爱沙尼亚',
    enName: 'Estonia',
    iso: 'EST',
    level: 1,
    osmRelationIds: [79510],
    mfwId: 17411
  },
  'Ethiopia': {
    zhName: '埃塞俄比亚',
    enName: 'Ethiopia',
    iso: 'ETH',
    level: 1,
    osmRelationIds: [192800],
    mfwId: 17412
  },
  'Fiji': {
    zhName: '斐济',
    enName: 'Fiji',
    iso: 'FJI',
    level: 1,
    osmRelationIds: [571747],
    mfwId: 17413
  },
  'Gabon': {
    zhName: '加蓬',
    enName: 'Gabon',
    iso: 'GAB',
    level: 1,
    osmRelationIds: [192793],
    mfwId: 17417
  },
  'Gambia': {
    zhName: '冈比亚',
    enName: 'Gambia',
    iso: 'GMB',
    level: 1,
    osmRelationIds: [192774],
    mfwId: 17420
  },
  'Georgia': {
    zhName: '格鲁吉亚',
    enName: 'Georgia',
    iso: 'GEO',
    level: 1,
    osmRelationIds: [28699],
    mfwId: 17421
  },
  'Germany': {
    zhName: '德国',
    enName: 'Germany',
    iso: 'DEU',
    level: 1,
    osmRelationIds: [51477],
    mfwId: 17404
  },
  'Ghana': {
    zhName: '加纳',
    enName: 'Ghana',
    iso: 'GHA',
    osmRelationIds: [192781],
    mfwId: 17422
  },
  'Greece': {
    zhName: '希腊',
    enName: 'Greece',
    iso: 'GRC',
    level: 1,
    osmRelationIds: [192307],
    mfwId: 17424
  },
  'Grenada': {
    zhName: '格林纳达',
    enName: 'Grenada',
    iso: 'GRD',
    level: 1,
    osmRelationIds: [550727],
    mfwId: 17426
  },
  'Guatemala': {
    zhName: '危地马拉',
    enName: 'Guatemala',
    iso: 'GTM',
    level: 1,
    osmRelationIds: [1521463],
    mfwId: 17428
  },
  'Guinea': {
    zhName: '几内亚',
    enName: 'Guinea',
    iso: 'GIN',
    level: 1,
    osmRelationIds: [192778],
    mfwId: 17429
  },
  'Guinea-Bissau': {
    zhName: '几内亚比索',
    enName: 'Guinea-Bissau',
    iso: 'GNB',
    level: 1,
    osmRelationIds: [192776],
    mfwId: 17430
  },
  'Guyana': {
    zhName: '圭亚那',
    enName: 'Guyana',
    iso: 'GUY',
    level: 1,
    osmRelationIds: [287083],
    mfwId: 17431
  },
  'Haiti': {
    zhName: '海地',
    enName: 'Haiti',
    iso: 'HTI',
    level: 1,
    osmRelationIds: [307829],
    mfwId: 17433
  },
  // Holy See
  'Civitas Vaticana': {
    zhName: '梵蒂冈',
    enName: 'Civitas Vaticana',
    iso: 'VAT',
    level: 1,
    osmRelationIds: [36989],
    mfwId: 17552
  },
  'Honduras': {
    zhName: '洪都拉斯',
    enName: 'Honduras',
    iso: 'HND',
    level: 1,
    osmRelationIds: [287670],
    mfwId: 17434
  },
  'Hungary': {
    zhName: '匈牙利',
    enName: 'Hungary',
    iso: 'HUN',
    level: 1,
    osmRelationIds: [21335],
    mfwId: 17435
  },
  'Iceland': {
    zhName: '冰岛',
    enName: 'Iceland',
    iso: 'ISL',
    level: 1,
    osmRelationIds: [299133],
    mfwId: 17436
  },
  'India': {
    zhName: '印度',
    enName: 'India',
    iso: 'IND',
    level: 1,
    osmRelationIds: [304716],
    mfwId: 17437
  },
  'Indonesia': {
    zhName: '印度尼西亚',
    enName: 'Indonesia',
    iso: 'IDN',
    level: 1,
    osmRelationIds: [304751],
    mfwId: 17438
  },
  'Iran': {
    zhName: '伊朗',
    enName: 'Iran',
    iso: 'IRN',
    level: 1,
    osmRelationIds: [304938],
    mfwId: 17439
  },
  'Iraq': {
    zhName: '伊拉克',
    enName: 'Iraq',
    iso: 'IRQ',
    level: 1,
    osmRelationIds: [304934],
    mfwId: 17440
  },
  'Ireland': {
    zhName: '爱尔兰',
    enName: 'Ireland',
    iso: 'IRL',
    level: 1,
    osmRelationIds: [62273],
    mfwId: 17441
  },
  'Israel': {
    zhName: '以色列',
    enName: 'Israel',
    iso: 'ISR',
    level: 1,
    osmRelationIds: [1473946],
    mfwId: 17442
  },
  'Italy': {
    zhName: '意大利',
    enName: 'Italy',
    iso: 'ITA',
    level: 1,
    osmRelationIds: [365331],
    mfwId: 17443
  },
  'Jamaica': {
    zhName: '牙买加',
    enName: 'Jamaica',
    iso: 'JAM',
    level: 1,
    osmRelationIds: [555017],
    mfwId: 17444
  },
  'Japan': {
    zhName: '日本',
    enName: 'Japan',
    iso: 'JPN',
    level: 1,
    osmRelationIds: [382313],
    mfwId: 17445
  },
  'Jordan': {
    zhName: '约旦',
    enName: 'Jordan',
    iso: 'JOR',
    level: 1,
    osmRelationIds: [184818],
    mfwId: 17446
  },
  'Kazakhstan': {
    zhName: '哈萨克斯坦',
    enName: 'Kazakhstan',
    iso: 'KAZ',
    level: 1,
    osmRelationIds: [214665],
    mfwId: 17447
  },
  'Kenya': {
    zhName: '肯尼亚',
    enName: 'Kenya',
    iso: 'KEN',
    level: 1,
    osmRelationIds: [192798],
    mfwId: 17448
  },
  'Kiribati': {
    zhName: '基里巴斯',
    enName: 'Kiribati',
    iso: 'KIR',
    level: 1,
    osmRelationIds: [571178],
    mfwId: 17449
  },
  'Kuwait': {
    zhName: '科威特',
    enName: 'Kuwait',
    iso: 'KWT',
    osmRelationIds: [305099],
    mfwId: 17454
  },
  'Kyrgyzstan': {
    zhName: '吉尔吉斯斯坦',
    enName: 'Kyrgyzstan',
    iso: 'KGZ',
    level: 1,
    osmRelationIds: [178009],
    mfwId: 17455
  },
  'Kosovo': {
    zhName: '科索沃',
    enName: 'Kosovo',
    iso: 'XKO',
    level: 1,
    osmRelationIds: [2088990],
    mfwId: 17568
  },
  'Laos': {
    zhName: '老挝',
    enName: 'Laos',
    iso: 'LAO',
    level: 1,
    osmRelationIds: [49903],
    mfwId: 17457
  },
  'Latvia': {
    zhName: '拉脱维亚',
    enName: 'Latvia',
    iso: 'LVA',
    level: 1,
    osmRelationIds: [72594],
    mfwId: 17459
  },
  'Lebanon': {
    zhName: '黎巴嫩',
    enName: 'Lebanon',
    iso: 'LBN',
    level: 1,
    osmRelationIds: [184843],
    mfwId: 17460
  },
  'Lesotho': {
    zhName: '莱索托',
    enName: 'Lesotho',
    iso: 'LSO',
    level: 1,
    osmRelationIds: [2093234],
    mfwId: 17461
  },
  'Liberia': {
    zhName: '利比里亚',
    enName: 'Liberia',
    iso: 'LBR',
    level: 1,
    osmRelationIds: [192780],
    mfwId: 17462
  },
  'Libya': {
    zhName: '利比亚',
    enName: 'Libya',
    iso: 'LBY',
    level: 1,
    osmRelationIds: [192758],
    mfwId: 17463
  },
  'Liechtenstein': {
    zhName: '列支敦士登',
    enName: 'Liechtenstein',
    iso: 'LIE',
    level: 1,
    osmRelationIds: [1155955],
    mfwId: 17464
  },
  'Lithuania': {
    zhName: '立陶宛',
    enName: 'Lithuania',
    iso: 'LTU',
    level: 1,
    osmRelationIds: [72596],
    mfwId: 17465
  },
  'Luxembourg': {
    zhName: '卢森堡',
    enName: 'Luxembourg',
    iso: 'LUX',
    level: 1,
    osmRelationIds: [2171347],
    mfwId: 17466
  },
  'Madagascar': {
    zhName: '马达加斯加',
    enName: 'Madagascar',
    iso: 'MDG',
    level: 1,
    osmRelationIds: [447325],
    mfwId: 17468
  },
  'Malawi': {
    zhName: '马拉维',
    enName: 'Malawi',
    iso: 'MWI',
    level: 1,
    osmRelationIds: [195290],
    mfwId: 17469
  },
  'Malaysia': {
    zhName: '马来西亚',
    enName: 'Malaysia',
    iso: 'MYS',
    level: 1,
    osmRelationIds: [2108121],
    mfwId: 17470
  },
  'Maldives': {
    zhName: '马尔代夫',
    enName: 'Maldives',
    iso: 'MDV',
    level: 1,
    osmRelationIds: [536773],
    mfwId: 17471
  },
  'Mali': {
    zhName: '马里共和国',
    enName: 'Mali',
    iso: 'MLI',
    level: 1,
    osmRelationIds: [192785],
    mfwId: 17472
  },
  'Malta': {
    zhName: '马耳他',
    enName: 'Malta',
    iso: 'MLT',
    level: 1,
    osmRelationIds: [365307],
    mfwId: 17473
  },
  'Marshall Islands': {
    zhName: '马绍尔群岛',
    enName: 'Marshall Islands',
    iso: 'MHL',
    level: 1,
    osmRelationIds: [571771]
  },
  'Mauritania': {
    zhName: '毛里塔尼亚',
    enName: 'Mauritania',
    iso: 'MRT',
    level: 1,
    osmRelationIds: [192763],
    mfwId: 17474
  },
  'Mauritius': {
    zhName: '毛里求斯',
    enName: 'Mauritius',
    iso: 'MUS',
    level: 1,
    osmRelationIds: [535828],
    mfwId: 17476
  },
  'Mexico': {
    zhName: '墨西哥',
    enName: 'Mexico',
    iso: 'MEX',
    level: 1,
    osmRelationIds: [114686],
    mfwId: 17477
  },
  'Micronesia': {
    zhName: '密克罗尼西亚',
    enName: 'Micronesia',
    iso: 'FSM',
    level: 1,
    osmRelationIds: [571802],
    mfwId: 17416
  },
  'Moldova': {
    zhName: '摩尔多瓦',
    enName: 'Moldova',
    iso: 'MDA',
    level: 1,
    osmRelationIds: [58974],
    mfwId: 17478
  },
  'Monaco': {
    zhName: '摩纳哥',
    enName: 'Monaco',
    iso: 'MCO',
    level: 1,
    osmRelationIds: [1124039],
    mfwId: 17479
  },
  'Mongolia': {
    zhName: '蒙古国',
    enName: 'Mongolia',
    iso: 'MNG',
    level: 1,
    osmRelationIds: [161033],
    mfwId: 17480
  },
  'Montenegro': {
    zhName: '蒙特内哥罗',
    // 黑山
    enName: 'Montenegro',
    iso: 'MNE',
    level: 1,
    osmRelationIds: [53296],
    mfwId: 17569
  },
  'Morocco': {
    zhName: '摩洛哥',
    enName: 'Morocco',
    iso: 'MAR',
    level: 1,
    osmRelationIds: [3630439],
    mfwId: 17482
  },
  'Mozambique': {
    zhName: '莫桑比克',
    enName: 'Mozambique',
    iso: 'MOZ',
    level: 1,
    osmRelationIds: [195273],
    mfwId: 17483
  },
  'Myanmar (Burma)': {
    zhName: '缅甸',
    enName: 'Myanmar (Burma)',
    iso: 'MMR',
    level: 1,
    osmRelationIds: [50371],
    mfwId: 17484
  },
  'Namibia': {
    zhName: '纳米比亚',
    enName: 'Namibia',
    iso: 'NAM',
    level: 1,
    osmRelationIds: [195266],
    mfwId: 17486
  },
  'Nauru': {
    zhName: '瑙鲁',
    enName: 'Nauru',
    iso: 'NRU',
    level: 1,
    osmRelationIds: [571804],
    mfwId: 17487
  },
  'Nepal': {
    zhName: '尼泊尔',
    enName: 'Nepal',
    iso: 'NPL',
    level: 1,
    osmRelationIds: [184633],
    mfwId: 17488
  },
  'Nicaragua': {
    zhName: '尼加拉瓜',
    enName: 'Nicaragua',
    iso: 'NIC',
    level: 1,
    osmRelationIds: [287666],
    mfwId: 17492
  },
  'Niger': {
    zhName: '尼日尔',
    enName: 'Niger',
    iso: 'NER',
    level: 1,
    osmRelationIds: [192786],
    mfwId: 17493
  },
  'Nigeria': {
    zhName: '尼日利亚',
    enName: 'Nigeria',
    iso: 'NGA',
    level: 1,
    osmRelationIds: [192787],
    mfwId: 17494
  },
  'North Korea': {
    zhName: '朝鲜',
    enName: 'North Korea',
    iso: 'PRK',
    level: 1,
    osmRelationIds: [192734],
    mfwId: 17450
  },
  'North Macedonia': {
    zhName: '北马其顿',
    enName: 'North Macedonia',
    iso: 'MKD',
    level: 1,
    osmRelationIds: [53293],
    mfwId: 17567
  },
  'Oman': {
    zhName: '阿曼',
    enName: 'Oman',
    iso: 'OMN',
    level: 1,
    osmRelationIds: [305138],
    mfwId: 17498
  },
  'Pakistan': {
    zhName: '巴基斯坦',
    enName: 'Pakistan',
    iso: 'PAK',
    level: 1,
    osmRelationIds: [307573]
  },
  'Palau': {
    zhName: '帕劳',
    enName: 'Palau',
    iso: 'PLW',
    level: 1,
    osmRelationIds: [571805],
    mfwId: 17499
  },
  'Palestine': {
    zhName: '巴勒斯坦',
    enName: 'Palestine',
    iso: 'PSE',
    level: 1,
    osmRelationIds: [1703814],
    mfwId: 17565
  },
  'Panama': {
    zhName: '巴拿马',
    enName: 'Panama',
    iso: 'PAN',
    level: 1,
    osmRelationIds: [287668],
    mfwId: 17502
  },
  'Papua New Guinea': {
    zhName: '巴布亚新几内亚',
    enName: 'Papua New Guinea',
    iso: 'PNG',
    level: 1,
    osmRelationIds: [307866],
    mfwId: 17503
  },
  'Paraguay': {
    zhName: '巴拉圭',
    enName: 'Paraguay',
    iso: 'PRY',
    level: 1,
    osmRelationIds: [287077],
    mfwId: 17504
  },
  'Peru': {
    zhName: '秘鲁',
    enName: 'Peru',
    iso: 'PER',
    level: 1,
    osmRelationIds: [288247],
    mfwId: 17505
  },
  'Philippines': {
    zhName: '菲律宾',
    enName: 'Philippines',
    iso: 'PHL',
    level: 1,
    osmRelationIds: [443174],
    mfwId: 17506
  },
  'Poland': {
    zhName: '波兰',
    enName: 'Poland',
    iso: 'POL',
    level: 1,
    osmRelationIds: [49715],
    mfwId: 17508
  },
  'Portugal': {
    zhName: '葡萄牙',
    enName: 'Portugal',
    iso: 'PRT',
    level: 1,
    osmRelationIds: [295480],
    mfwId: 17509
  },
  'Qatar': {
    zhName: '卡塔尔',
    enName: 'Qatar',
    iso: 'QAT',
    level: 1,
    osmRelationIds: [305095],
    mfwId: 17511
  },
  'Romania': {
    zhName: '罗马尼亚',
    enName: 'Romania',
    iso: 'ROU',
    level: 1,
    osmRelationIds: [90689],
    mfwId: 17512
  },
  'Russia': {
    zhName: '俄罗斯',
    enName: 'Russia',
    iso: 'RUS',
    level: 1,
    osmRelationIds: [60189],
    mfwId: 17513
  },
  'Rwanda': {
    zhName: '卢旺达',
    enName: 'Rwanda',
    iso: 'RWA',
    level: 1,
    osmRelationIds: [171496],
    mfwId: 17514
  },
  'Saint Kitts and Nevis': {
    zhName: '圣基茨和尼维斯',
    enName: 'Saint Kitts and Nevis',
    iso: 'KNA',
    level: 1,
    osmRelationIds: [536899],
    mfwId: 17572
  },
  'Saint Lucia': {
    zhName: '圣卢西亚',
    enName: 'Saint Lucia',
    iso: 'LCA',
    level: 1,
    osmRelationIds: [550728],
    mfwId: 17467
  },
  'Saint Vincent and the Grenadines': {
    zhName: '圣文森特和格林纳丁斯',
    enName: 'Saint Vincent and the Grenadines',
    iso: 'VCT',
    level: 1,
    osmRelationIds: [550725],
    mfwId: 17571
  },
  'Samoa': {
    zhName: '萨摩亚',
    enName: 'Samoa',
    iso: 'WSM',
    level: 1,
    osmRelationIds: [1872673],
    mfwId: 17556
  },
  'San Marino': {
    zhName: '圣马力诺',
    enName: 'San Marino',
    iso: 'SMR',
    level: 1,
    osmRelationIds: [54624],
    mfwId: 17516
  },
  'Sao Tome and Principe': {
    zhName: '圣多美和普林西比',
    enName: 'Sao Tome and Principe',
    iso: 'STP',
    level: 1,
    osmRelationIds: [535880],
    mfwId: 17517
  },
  'Saudi Arabia': {
    zhName: '沙特阿拉伯',
    enName: 'Saudi Arabia',
    iso: 'SAU',
    level: 1,
    osmRelationIds: [307584],
    mfwId: 17518
  },
  'Senegal': {
    zhName: '塞内加尔',
    enName: 'Senegal',
    iso: 'SEN',
    level: 1,
    osmRelationIds: [192775],
    mfwId: 17519
  },
  'Serbia': {
    zhName: '塞尔维亚',
    enName: 'Serbia',
    iso: 'SRB',
    level: 1,
    osmRelationIds: [1741311],
    mfwId: 17566
  },
  'Seychelles': {
    zhName: '塞舌尔',
    enName: 'Seychelles',
    iso: 'SYC',
    level: 1,
    osmRelationIds: [536765],
    mfwId: 17520
  },
  'Sierra Leone': {
    zhName: '塞拉利昂',
    enName: 'Sierra Leone',
    iso: 'SLE',
    level: 1,
    osmRelationIds: [192777],
    mfwId: 17521
  },
  'Singapore': {
    zhName: '新加坡',
    enName: 'Singapore',
    iso: 'SGP',
    level: 1,
    osmRelationIds: [536780],
    mfwId: 17522
  },
  'Slovakia': {
    zhName: '斯洛伐克',
    enName: 'Slovakia',
    iso: 'SVK',
    level: 1,
    osmRelationIds: [14296],
    mfwId: 17523
  },
  'Slovenia': {
    zhName: '斯洛文尼亚',
    enName: 'Slovenia',
    iso: 'SVN',
    osmRelationIds: [218657],
    mfwId: 17524
  },
  'Solomon Islands': {
    zhName: '所罗门群岛',
    enName: 'Solomon Islands',
    iso: 'SLB',
    level: 1,
    osmRelationIds: [1857436],
    mfwId: 17525
  },
  'Somalia': {
    zhName: '索马里',
    enName: 'Somalia',
    iso: 'SOM',
    level: 1,
    osmRelationIds: [192799],
    mfwId: 17526
  },
  'South Africa': {
    zhName: '南非',
    enName: 'South Africa',
    iso: 'ZAF',
    level: 1,
    osmRelationIds: [87565],
    mfwId: 17558
  },
  'South Korea': {
    zhName: '韩国',
    enName: 'South Korea',
    iso: 'KOR',
    level: 1,
    osmRelationIds: [307756],
    mfwId: 17451
  },
  'South Sudan': {
    zhName: '南苏丹',
    enName: 'South Sudan',
    iso: 'SSD',
    level: 1,
    osmRelationIds: [1656678],
    mfwId: 17564
  },
  'Spain': {
    zhName: '西班牙',
    enName: 'Spain',
    iso: 'ESP',
    level: 1,
    osmRelationIds: [1311341],
    mfwId: 17410
  },
  'Sri Lanka': {
    zhName: '斯里兰卡',
    enName: 'Sri Lanka',
    iso: 'LKA',
    level: 1,
    osmRelationIds: [536807],
    mfwId: 17458
  },
  'Sudan': {
    zhName: '苏丹',
    enName: 'Sudan',
    iso: 'SDN',
    level: 1,
    osmRelationIds: [192789],
    mfwId: 17527
  },
  'Suriname': {
    zhName: '苏里南',
    enName: 'Suriname',
    iso: 'SUR',
    level: 1,
    osmRelationIds: [287082],
    mfwId: 17528
  },
  'Swaziland': {
    zhName: '斯威士兰',
    enName: 'Swaziland',
    iso: 'SWZ',
    level: 1,
    osmRelationIds: [88210],
    mfwId: 17529
  },
  'Sweden': {
    zhName: '瑞典',
    enName: 'Sweden',
    iso: 'SWE',
    level: 1,
    osmRelationIds: [52822],
    mfwId: 17530
  },
  'Switzerland': {
    zhName: '瑞士',
    enName: 'Switzerland',
    iso: 'CHE',
    level: 1,
    osmRelationIds: [51701],
    mfwId: 17393
  },
  'Syria': {
    zhName: '叙利亚',
    enName: 'Syria',
    iso: 'SYR',
    level: 1,
    osmRelationIds: [184840],
    mfwId: 17531
  },
  'Tajikistan': {
    zhName: '塔吉克斯坦',
    enName: 'Tajikistan',
    iso: 'TJK',
    level: 1,
    osmRelationIds: [214626],
    mfwId: 17533
  },
  'Tanzania': {
    zhName: '坦桑尼亚',
    enName: 'Tanzania',
    iso: 'TZA',
    level: 1,
    osmRelationIds: [195270],
    mfwId: 17534
  },
  'Thailand': {
    zhName: '泰国',
    enName: 'Thailand',
    iso: 'THA',
    level: 1,
    osmRelationIds: [2067731],
    mfwId: 17535
  },
  'Timor-Leste': {
    zhName: '东帝汶',
    enName: 'Timor-Leste',
    iso: 'TLS',
    level: 1,
    osmRelationIds: [305142],
    mfwId: 17542
  },
  'Togo': {
    zhName: '多哥',
    enName: 'Togo',
    iso: 'TGO',
    level: 1,
    osmRelationIds: [192782],
    mfwId: 17536
  },
  'Tonga': {
    zhName: '汤加',
    enName: 'Tonga',
    iso: 'TON',
    level: 1,
    osmRelationIds: [2186665],
    mfwId: 17538
  },
  'Trinidad and Tobago': {
    zhName: '特立尼达和多巴哥',
    enName: 'Trinidad and Tobago',
    iso: 'TTO',
    level: 1,
    osmRelationIds: [555717],
    mfwId: 17539
  },
  'Tunisia': {
    zhName: '突尼斯',
    enName: 'Tunisia',
    iso: 'TUN',
    level: 1,
    osmRelationIds: [192757],
    mfwId: 17540
  },
  'Turkey': {
    zhName: '土耳其',
    enName: 'Turkey',
    iso: 'TUR',
    level: 1,
    osmRelationIds: [174737],
    mfwId: 17541
  },
  'Turkmenistan': {
    zhName: '土库曼斯坦',
    enName: 'Turkmenistan',
    iso: 'TKM',
    level: 1,
    osmRelationIds: [223026],
    mfwId: 17543
  },
  'Tuvalu': {
    zhName: '图瓦卢',
    enName: 'Tuvalu',
    iso: 'TUV',
    level: 1,
    osmRelationIds: [2177266],
    mfwId: 17545
  },
  'Uganda': {
    zhName: '乌干达',
    enName: 'Uganda',
    iso: 'UGA',
    level: 1,
    osmRelationIds: [192796],
    mfwId: 17546
  },
  'Ukraine': {
    zhName: '乌克兰',
    enName: 'Ukraine',
    iso: 'UKR',
    level: 1,
    osmRelationIds: [60199],
    mfwId: 17547
  },
  'United Arab Emirates': {
    zhName: '阿拉伯联合酋长国',
    enName: 'United Arab Emirates',
    iso: 'ARE',
    level: 1,
    osmRelationIds: [307763],
    mfwId: 17353
  },
  'Uruguay': {
    zhName: '乌拉圭',
    enName: 'Uruguay',
    iso: 'URY',
    level: 1,
    osmRelationIds: [287072],
    mfwId: 17550
  },
  'Uzbekistan': {
    zhName: '乌兹别克斯坦',
    enName: 'Uzbekistan',
    iso: 'UZB',
    level: 1,
    osmRelationIds: [196240],
    mfwId: 17551
  },
  'Vanuatu': {
    zhName: '瓦努阿图',
    enName: 'Vanuatu',
    iso: 'VUT',
    level: 1,
    osmRelationIds: [2177246],
    mfwId: 17575
  },
  'Venezuela': {
    zhName: '委内瑞拉',
    enName: 'Venezuela',
    iso: 'VEN',
    level: 1,
    osmRelationIds: [272644],
    mfwId: 17553
  },
  'Vietnam': {
    zhName: '越南',
    enName: 'Vietnam',
    iso: 'VNM',
    level: 1,
    osmRelationIds: [49915],
    mfwId: 17554
  },
  'Yemen': {
    zhName: '也门',
    enName: 'Yemen',
    iso: 'YEM',
    level: 1,
    osmRelationIds: [305092],
    mfwId: 17557
  },
  'Western Sahara': {
    zhName: '西撒哈拉',
    enName: 'Western Sahara',
    iso: 'ESH',
    level: 1,
    osmRelationIds: [2559126],
    mfwId: 17409
  },
  'Zambia': {
    zhName: '赞比亚',
    enName: 'Zambia',
    iso: 'ZMB',
    level: 1,
    osmRelationIds: [195271],
    mfwId: 17560
  },
  'Zimbabwe': {
    zhName: '津巴布韦',
    enName: 'Zimbabwe',
    iso: 'ZWE',
    level: 1,
    osmRelationIds: [195272],
    mfwId: 17561
  },
  // 特殊国家
  // 英国
  'United Kingdom': {
    zhName: '英国',
    enName: 'United Kingdom',
    iso: 'GBR',
    level: 0,
    osmRelationIds: [62149, // 英国本土
    9110397, // 英国皇家属地
    // 3969434, // 英国海外林地
    1278736, 285454, 1983628, 1993867, 547479, 2177161, 2185366, 2185375, 2185374, 3263728, 1993208, 1964272, 537257],
    mfwId: 17548,
    subs: {
      'contiguous United Kingdom': {
        zhName: '英国本土',
        enName: 'contiguous United Kingdom',
        iso: '',
        level: 1,
        osmRelationIds: [62149]
      },
      // 英国海外领土
      'British Overseas Territories': {
        zhName: '英国海外领土',
        enName: 'British Overseas Territories',
        iso: '',
        level: 0,
        osmRelationIds: [3969434],
        subs: {
          'Gibraltar': {
            zhName: '直布罗陀',
            enName: 'Gibraltar',
            iso: 'GIB',
            level: 1,
            osmRelationIds: [1278736]
          },
          'British Virgin Islands': {
            zhName: '英属维尔京群岛',
            enName: 'British Virgin Islands',
            iso: 'VGB',
            level: 1,
            osmRelationIds: [285454]
          },
          'South Georgia and South Sandwich Islands': {
            zhName: '南乔治亚和南桑德威奇群岛',
            enName: 'South Georgia and South Sandwich Islands',
            iso: 'SGS',
            level: 1,
            osmRelationIds: [1983628]
          },
          'British Indian Ocean Territory': {
            zhName: '英属印度洋领地',
            enName: 'British Indian Ocean Territory',
            iso: 'IOT',
            level: 1,
            osmRelationIds: [1993867]
          },
          'Turks and Caicos Islands': {
            zhName: '特克斯和凯科斯群岛',
            enName: 'Turks and Caicos Islands',
            iso: 'TCA',
            level: 1,
            osmRelationIds: [547479]
          },
          'Anguilla': {
            zhName: '安圭拉',
            enName: 'Anguilla',
            iso: 'AIA',
            level: 1,
            osmRelationIds: [2177161]
          },
          'Cayman Islands': {
            zhName: '开曼群岛',
            enName: 'Cayman Islands',
            iso: 'CYM',
            level: 1,
            osmRelationIds: [2185366]
          },
          'Pitcairn Islands': {
            zhName: '皮特凯恩群岛',
            enName: 'Pitcairn Islands',
            iso: 'PCN',
            level: 1,
            osmRelationIds: [2185375]
          },
          'Falkland Islands': {
            zhName: '福克兰群岛',
            enName: 'Falkland Islands',
            iso: 'FLK',
            level: 1,
            osmRelationIds: [2185374]
          },
          'Akrotiri and Dhekelia': {
            zhName: '阿克罗蒂里和泽凯利亚主权基地区',
            enName: 'Akrotiri and Dhekelia',
            iso: 'XAD',
            level: 1,
            osmRelationIds: [3263728]
          },
          'Bermuda Islands': {
            zhName: '百慕大群岛',
            enName: 'Bermuda Islands',
            iso: 'BMU',
            level: 1,
            osmRelationIds: [1993208]
          },
          'Saint Helena': {
            zhName: '圣赫勒拿岛',
            enName: 'Saint Helena',
            iso: 'SHN',
            level: 1,
            osmRelationIds: [1964272]
          },
          'Montserrat': {
            zhName: '蒙塞拉特岛',
            enName: 'Montserrat',
            iso: 'MSR',
            level: 1,
            osmRelationIds: [537257]
          },
          'British Antarctic Territory': {
            zhName: '英属南极领地',
            enName: 'British Antarctic Territory',
            iso: '',
            level: 0,
            osmRelationIds: [3394112]
          }
        }
      },
      // 英国皇室属地
      'British Crown Dependencies': {
        zhName: '英国皇家属地',
        enName: 'British Crown Dependencies',
        iso: '',
        level: 0,
        osmRelationIds: [9110397],
        subs: {
          'Guernsey': {
            zhName: '根西岛',
            enName: 'Guernsey',
            iso: 'GGY',
            level: 1,
            osmRelationIds: [270009]
          },
          'Jersey': {
            zhName: '泽西岛',
            enName: 'Jersey',
            iso: 'JEY',
            level: 1,
            osmRelationIds: [367988]
          },
          'Isle of Man': {
            zhName: '马恩岛',
            enName: 'Isle of Man',
            iso: 'IMN',
            level: 1,
            osmRelationIds: [62269]
          }
        }
      }
    }
  },
  // 丹麦王国
  'Kingdom of Denmark': {
    zhName: '丹麦王国',
    enName: 'Kingdom of Denmark',
    iso: '',
    level: 0,
    osmRelationIds: [9112011],
    mfwId: 17401,
    subs: {
      'Denmark': {
        zhName: '丹麦',
        enName: 'Denmark',
        iso: 'DNK',
        level: 1,
        osmRelationIds: [50046]
      },
      'GreenLand': {
        zhName: '格林兰岛',
        enName: 'GreenLand',
        iso: 'GRL',
        level: 1,
        osmRelationIds: [2184073]
      },
      'Faroe Islands': {
        zhName: '法罗群岛',
        enName: 'Faroe Islands',
        iso: 'FRO',
        level: 1,
        osmRelationIds: [52939]
      }
    }
  },
  // 荷兰王国
  'Netherlands': {
    zhName: '荷兰王国',
    enName: 'Netherlands',
    iso: '',
    level: 0,
    osmRelationIds: [2323309],
    mfwId: 17489,
    subs: {
      'Aruba': {
        zhName: '阿鲁巴',
        enName: 'Aruba',
        iso: 'ABW',
        level: 1,
        osmRelationIds: [1231749]
      },
      'Curacao': {
        zhName: '库拉索',
        enName: 'Curacao',
        iso: 'CUW',
        level: 1,
        osmRelationIds: [1216719]
      },
      'Sint Maarten (Netherlands)': {
        zhName: '荷属圣马丁',
        enName: 'Sint Maarten (Netherlands)',
        iso: 'SXM',
        level: 1,
        osmRelationIds: [1231790]
      },
      'Nederland': {
        zhName: '荷兰',
        enName: 'Nederland',
        iso: 'NLD',
        level: 1,
        osmRelationIds: [47796]
      },
      'Caribisch Nederland': {
        zhName: '荷兰加勒比区',
        enName: 'Caribisch Nederland',
        iso: 'BES',
        level: 1,
        osmRelationIds: [1216720]
      }
    }
  },
  // 新西兰王国
  'Realm of New Zealand': {
    zhName: '新西兰王国',
    enName: 'Realm of New Zealand',
    iso: '',
    level: 0,
    mfwId: 17491,
    osmRelationIds: [556706, // 新西兰主岛
    2184233, // 库克群岛
    1558556, // 纽埃
    2186600 // 托克劳
    // 1844217, // 南极罗斯岛 无国旗
    ],
    subs: {
      'New Zealand': {
        zhName: '新西兰',
        enName: 'New Zealand',
        iso: 'NZL',
        level: 1,
        osmRelationIds: [556706]
      },
      'Cook Islands': {
        zhName: '库克群岛',
        enName: 'Cook Islands',
        iso: 'COK',
        level: 1,
        osmRelationIds: [2184233]
      },
      'Niue': {
        zhName: '纽埃',
        enName: 'Niue',
        iso: 'NIU',
        level: 1,
        osmRelationIds: [1558556]
      },
      'Tokelau': {
        zhName: '托克劳',
        enName: 'Tokelau',
        iso: 'TKL',
        level: 1,
        osmRelationIds: [2186600]
      },
      'Ross Island': {
        zhName: '南极罗斯岛',
        enName: 'Ross Island',
        iso: '',
        level: 0,
        osmRelationIds: [1844217]
      }
    }
  },
  // 法兰西共和国
  'French Republic': {
    zhName: '法兰西共和国',
    enName: 'French Republic',
    iso: '',
    level: 0,
    osmRelationIds: [2202162],
    mfwId: 17415,
    subs: {
      'France': {
        zhName: '法国',
        enName: 'France',
        iso: 'FRA',
        level: 1,
        osmRelationIds: [1403916]
      },
      'Guadeloupe': {
        zhName: '瓜德罗普',
        enName: 'Guadeloupe',
        iso: 'GLP',
        level: 1,
        osmRelationIds: [1401835]
      },
      'Martinique': {
        zhName: '马提尼克',
        enName: 'Martinique',
        iso: 'MTQ',
        level: 1,
        osmRelationIds: [1891495]
      },
      'French Guiana': {
        zhName: '法属圭亚那',
        enName: 'French Guiana',
        iso: 'GUF',
        level: 1,
        osmRelationIds: [1260551]
      },
      'Reunion': {
        zhName: '留尼旺',
        enName: 'Reunion',
        iso: 'REU',
        level: 1,
        osmRelationIds: [1785276]
      },
      'Mayotte': {
        zhName: '马约特',
        enName: 'Mayotte',
        iso: 'MYT',
        level: 1,
        osmRelationIds: [1259885]
      },
      'Saint Pierre and Miquelon': {
        zhName: '圣皮埃尔和密克隆群岛',
        enName: 'Saint Pierre and Miquelon',
        iso: 'SPM',
        level: 1,
        osmRelationIds: [3406826]
      },
      'Saint-Barthélemy': {
        zhName: '圣巴泰勒米',
        enName: 'Saint-Barthélemy',
        iso: 'BLM',
        level: 1,
        osmRelationIds: [537967]
      },
      'Saint Martin (France)': {
        zhName: '法属圣马丁',
        enName: 'Saint Martin (France)',
        iso: 'MAF',
        level: 1,
        osmRelationIds: [1891583]
      },
      'Wallis and Futuna': {
        zhName: '瓦利斯和富图纳群岛',
        enName: 'Wallis and Futuna',
        iso: 'WLF',
        level: 1,
        osmRelationIds: [3412448]
      },
      'French Polynesia': {
        zhName: '法属波利尼西亚',
        enName: 'French Polynesia',
        iso: 'PYF',
        level: 1,
        osmRelationIds: [3412620]
      },
      'French Southern Territories': {
        zhName: '法属南部领地',
        enName: 'French Southern Territories',
        iso: 'ATF',
        level: 1,
        osmRelationIds: [2186658]
      },
      'Clipperton Island': {
        zhName: '克利珀顿岛',
        enName: 'Clipperton Island',
        iso: 'XCL',
        level: 1,
        osmRelationIds: [2573009]
      },
      'New Caledonia': {
        zhName: '新喀里多尼亚',
        enName: 'New Caledonia',
        iso: 'NCL',
        level: 1,
        osmRelationIds: [3407643]
      }
    }
  },
  // 挪威王国
  'Norge': {
    zhName: '挪威王国',
    enName: 'Norge',
    iso: '',
    level: 0,
    osmRelationIds: [2978650],
    mfwId: 17497,
    subs: {
      'Norway': {
        zhName: '挪威',
        enName: 'Norway',
        iso: 'NOR',
        level: 1,
        osmRelationIds: [1059668]
      },
      'Bouvet Island': {
        zhName: '布韦岛',
        enName: 'Bouvet Island',
        iso: 'BVT',
        level: 1,
        osmRelationIds: [2425963]
      },
      'Svalbard and Jan Mayen': {
        zhName: '斯瓦巴和扬马延',
        enName: 'Svalbard and Jan Mayen',
        iso: 'SJM',
        level: 1,
        osmRelationIds: [3245620]
      }
    }
  },
  // 澳大利亚联邦
  'Commonwealth of Australia': {
    zhName: '澳大利亚联邦',
    enName: 'Commonwealth of Australia',
    iso: 'AUS',
    level: 0,
    osmRelationIds: [80500],
    mfwId: 17362,
    subs: {
      'Norfolk Island': {
        zhName: '诺福克岛',
        enName: 'Norfolk Island',
        iso: 'NFK',
        level: 1,
        osmRelationIds: [2574988]
      },
      'Cocos (Keeling) Islands': {
        zhName: '科科斯（基林）群岛',
        enName: 'Cocos (Keeling) Islands',
        iso: 'CCK',
        level: 1,
        osmRelationIds: [82636]
      },
      'Heard Island and McDonald Islands': {
        zhName: '赫德岛和麦克唐纳群岛',
        enName: 'Heard Island and McDonald Islands',
        iso: 'HMD',
        level: 1,
        osmRelationIds: [2177227]
      },
      'Christmas Island': {
        zhName: '圣诞岛',
        enName: 'Christmas Island',
        iso: 'CXR',
        level: 1,
        osmRelationIds: [2177207]
      }
    }
  },
  // 芬兰
  'Finland': {
    zhName: '芬兰',
    enName: 'Finland',
    iso: 'FIN',
    level: 1,
    osmRelationIds: [54224],
    mfwId: 17414
  },
  // 'Åland Islands': {
  //   zhName: '奥兰群岛',
  //   enName: 'Åland Islands',
  //   iso: 'ALA',
  //   osmRelationIds: [2375170]
  // },
  // 美国
  'United States of America': {
    zhName: '美国',
    enName: 'United States of America',
    iso: 'USA',
    level: 0,
    osmRelationIds: [148838, 306001, // 关岛
    306004 // 北马里亚纳群岛
    ],
    mfwId: 17549,
    subs: {
      'contiguous United States': {
        zhName: '美国本土',
        enName: 'contiguous United States',
        iso: '',
        level: 1,
        osmRelationIds: [9331155]
      },
      'Alaska': {
        zhName: '阿拉斯加',
        enName: 'Alaska',
        iso: '',
        level: 1,
        osmRelationIds: [1116270]
      },
      'American Overseas Territories': {
        zhName: '美国海外领地',
        enName: 'American Overseas Territories',
        iso: '',
        level: 0,
        osmRelationIds: [306001, // 关岛
        4422604, // 波多黎各
        2177187, // 美属萨摩亚
        306004, // 北马里亚纳群岛
        286898, // 美属维尔京群岛
        // 2185386 // 美国本土外小岛屿
        7248454, 7248457, 8161698, 7248458, 7248459, 7248460, 7248461, 6430384, 7248455],
        subs: {
          'Guam': {
            zhName: '关岛',
            enName: 'Guam',
            iso: 'GUM',
            level: 1,
            osmRelationIds: [306001]
          },
          'Puerto Rico': {
            zhName: '波多黎各',
            enName: 'Puerto Rico',
            iso: 'PRI',
            level: 1,
            osmRelationIds: [4422604]
          },
          'American Samoa': {
            zhName: '美属萨摩亚',
            enName: 'American Samoa',
            iso: 'ASM',
            level: 1,
            osmRelationIds: [2177187]
          },
          'Northern Mariana Islands': {
            zhName: '北马里亚纳群岛',
            enName: 'Northern Mariana Islands',
            iso: 'MNP',
            level: 1,
            osmRelationIds: [306004]
          },
          'Virgin Islands, U.S.': {
            zhName: '美属维尔京群岛',
            enName: 'Virgin Islands, U.S.',
            iso: 'VIR',
            level: 1,
            osmRelationIds: [286898]
          },
          'United States Minor Outlying Islands': {
            zhName: '美国本土外小岛屿',
            enName: 'United States Minor Outlying Islands',
            iso: 'UMI',
            level: 1,
            // osmRelationIds: [2185386]
            osmRelationIds: [7248454, 7248457, 8161698, 7248458, 7248459, 7248460, 7248461, 6430384, 7248455]
          }
        }
      }
    }
  },
  'Bir Tawil': {
    zhName: '比尔泰维勒',
    enName: 'Bir Tawil',
    iso: '',
    level: 1,
    osmRelationIds: [3335661],
    mfwId: 0
  },
  'Antarctica': {
    zhName: '南极洲',
    enName: 'Antarctica',
    iso: 'ATA',
    level: 0,
    osmRelationIds: [2186646],
    mfwId: 17347
  }
};

const iterate = async (index, parentId, level, fallback, dict) => {
  const list = Object.keys(dict);

  for await (const k of list) {
    index += 1;
    const v = dict[k];
    const indent = `=`.repeat(level);
    const desc = [indent, index, parentId, v.zhName, v.enName, v.iso]; // await Utils.log(...desc);

    await fallback(...[index, v, level, parentId, desc]);

    if (v['subs'] !== undefined) {
      index = await iterate(index, index, level + 1, fallback, v['subs']);
    }
  }

  return index;
};

var _default = {
  each: async fallback => {
    await iterate(0, 0, 0, fallback, countryDistrictTree);
  }
};
exports.default = _default;