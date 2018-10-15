// ----------------------------------------------------------------------
// costcomparison_rates.js
// Javascript array containing energy rates for various UK suppliers and tariffs
// for comparison purposes
// Note: "dailystandingcharge" isnt current used
// Note: Tariff rates assume same time periods are used every day, this isn't the case with TIDE tariff (weekends are cheaper)
// ----------------------------------------------------------------------

// Only a single price/tier (all time is same price)
var SINGLE_TIER_RATE_BUCKET = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var GREENENERGYTIDE_RATE_BUCKET = 
//48 item array containing which half hour segment belongs to which rate
//runs from 00:00 (midnight) to 23:59 in 30 minute segments
  [
    //00:00 to 01:00
    2, 2,
    //01:00 to 02:00
    2, 2,
    //02:00 to 03:00
    2, 2,
    //03:00 to 04:00
    2, 2,
    //04:00 to 05:00
    2, 2,
    //05:00 to 06:00
    2, 2,
    //06:00 to 07:00
    0, 0,
    //07
    0, 0,
    //08
    0, 0,
    //09
    0, 0,
    //10
    0, 0,
    //11
    0, 0,
    //12
    0, 0,
    //13
    0, 0,
    //14
    0, 0,
    //15
    0, 0,
    //16:00 to 17:00
    1, 1,
    //17:00 to 18:00
    1, 1,
    //18:00 to 19:00
    1, 1,
    //19:00 to 20:00
    1, 1,
    //20:00 to 21:00
    0, 0,
    //21:00 to 22:00
    0, 0,
    //22:00 to 23:00
    0, 0,
    //23:00 to 23:59
    0, 0
  ];
  
var ECONOMY7_MIDLANDS = [
//Useful NPOWER site for Economy 7 regions in UK
// https://customerservices.npower.com/app/answers/detail/a_id/179/~/what-are-the-economy-7-peak-and-off-peak-periods%3F
//23:30 to 08:00 is economy 7 hours
//00:00 to 08:00 in 30 minute segments
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //23:00 to 23:59
    0, 1
];

var ECONOMY7_SOUTHERN = [
//23:30 to 06:30 is economy 7 hours
    1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //23:00 to 23:59
    0, 1
];

var ECONOMY7_LONDON = [
//23:00 to 07:00 is economy 7 hours
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //23:00 to 23:59
    1,1
];

var ECONOMY7_SOUTHEAST = [
//22:30 to 00:30 and 02:30 to 07:30
    1,0,
    0,0,0,1,1,1,1,1,1,1,1,1,1,0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
    //22:30 to 00:00
    0,1,
    1,1
];


var colour1 = "#276FBF";    //Blue = normal rate
var colour2 = "#97CC04";    //Green = cheapest
var colour0 = "#F03A47";    //Red = high rate

var energy_rates = []

energy_rates.push( {

 identifier : "GREENENERGYTIDE20170713",
 label : "Tide tariff",
 supplier: "Green Energy",
 region : "MIDLANDS",
 updated_epoc : 1499978704,
//Rate zero = standard 11.99 pence
//Rate one  = premium 24.99 pence
//rate two  = low 4.99 pence
 rates : [{
        cost: 0.1402,
        colour: colour1
    },
    {
        cost: 0.2999,
        colour: colour0
    },
    {
        cost: 0.0641,
        colour: colour2
    }
 ],
 
dailystandingcharge: 0,
rate_bucket: GREENENERGYTIDE_RATE_BUCKET
});



energy_rates.push( {
 identifier : "SAINSBURYENERGYFIXEDPRICEFEB2018WESTMIDS",
 label : "Fixed Price February 2018",
 supplier : "Sainsbury's Energy",
 region : "MIDLANDS",
 updated_epoc : 1499978704,
//Rate zero = standard 10.98 pence
 rates : [{cost: 0.1098,colour: colour1}],
  dailystandingcharge: 0,
 rate_bucket : SINGLE_TIER_RATE_BUCKET
});


energy_rates.push( {
 identifier : "ECOTRICITYGREENELECTRICWESTMIDS",
 label : "Green Electricity",
 supplier : "Ecotricity",
 region : "MIDLANDS",
 updated_epoc : 1499978704,
 rates : [{cost: 0.1820,    colour: colour1 }],
  dailystandingcharge: 0,
 rate_bucket : SINGLE_TIER_RATE_BUCKET
});


energy_rates.push( {
 identifier : "NPOWERECONOMY7CLEANERENERGYFIXOCT2019MIDLANDS",
 label : "Economy 7 Cleaner Energy Fix October 2019",
 supplier : "NPOWER",
 region : "MIDLANDS",
 updated_epoc : 1499978704,
 rates : [{cost: 0.17829, colour: colour0},{cost: 0.08463, colour: colour1} ],
  dailystandingcharge: 0,
 rate_bucket : ECONOMY7_MIDLANDS
});


energy_rates.push( {
 identifier : "NPOWERECONOMY7STANDARDVARIABLEMIDLANDS",
 label : "Economy 7 Standard Variable",
 supplier : "NPOWER",
 region : "MIDLANDS",
 updated_epoc : 1499978704,
 rates : [{cost: 0.226065, colour: colour0},{cost: 0.08085, colour: colour1} ],
  dailystandingcharge: 0,
 rate_bucket : ECONOMY7_MIDLANDS
});


energy_rates.push( {
 identifier : "NPOWERECONOMY7STANDARDVARIABLESOUTHEAST",
 label : "Economy 7 Standard Variable",
 supplier : "NPOWER",
 region : "SOUTHEAST",
 updated_epoc : 1499978704,
 rates : [{cost: 0.224805, colour: colour0},{cost: 0.08169, colour: colour1}],
 dailystandingcharge: 0.158235,
 rate_bucket : ECONOMY7_SOUTHEAST
});
