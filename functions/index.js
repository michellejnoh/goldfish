/* Sends a notification to a keeper's phones when someone leaves them a gift or a duel result.
   Runs on Firebase (Cloud Functions). The private push key is kept as a secret named VAPID_PRIVATE, never in this repo. */
const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const {defineSecret}=require('firebase-functions/params');
const admin=require('firebase-admin');
const webpush=require('web-push');
admin.initializeApp();

const VAPID_PRIVATE=defineSecret('VAPID_PRIVATE');
const VAPID_PUBLIC='BDEPipv2IN9wI9dPO1kGk1dZGONmx5ZsLdFiol7YzgAITCGADzFOjtEkqgX3MKkgMiLDMC9IkvptOPunrTOUgck';
// must match where the Firestore database lives (Firebase console > Firestore > the location shown at the top)
const REGION=process.env.GOLDFISH_REGION||'us-central1';

const DECO={cane:'candy cane',gift:'gift box',ice:'ice crystals',snowman:'snowman',sled:'little sled',pine:'pine tree',penguin:'penguin',igloo:'igloo',bear:'polar bear',globe:'snow globe'};
const SNACK={cucumber:'cucumber',zucchini:'zucchini',banana:'banana'};

function text(g){const from='@'+g.from;
  if(g.kind==='snack')return from+' sent your fish a '+(SNACK[g.item]||'snack');
  if(g.kind==='fish')return from+' sent you a little fish';
  if(g.kind==='deco'){const id=String(g.item).split('@')[0];const n=DECO[id]||'decoration';return from+' sent you '+(/^[aeiou]/.test(n)?'an ':'a ')+n;}
  if(g.kind==='duel'){const [k,r]=String(g.item).split('.'),game=k==='balance'?'rock balancing':'rock stacking';
    return r==='l'?from+' challenged you to '+game+' and you won a winner ring':from+' challenged you to '+game+' and won this time';}
  return from+' sent you something';}

exports.giftPush=onDocumentCreated({document:'gifts/{to}/box/{id}',region:REGION,secrets:[VAPID_PRIVATE]},async event=>{
  const g=event.data&&event.data.data();if(!g||!g.from)return;
  const to=event.params.to,devs=await admin.firestore().collection('push').doc(to).collection('devices').get();if(devs.empty)return;
  webpush.setVapidDetails('https://michellejnoh.github.io/goldfish/',VAPID_PUBLIC,VAPID_PRIVATE.value());
  const payload=JSON.stringify({title:'Goldfish',body:text(g),tag:g.kind});
  await Promise.all(devs.docs.map(async d=>{const s=d.get('sub');if(!s)return;
    try{await webpush.sendNotification(JSON.parse(s),payload,{TTL:86400});}
    catch(e){if(e.statusCode===404||e.statusCode===410)await d.ref.set({sub:''},{merge:true});}}));});
