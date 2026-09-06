// A small in-memory document set for the search_documents tool.
// The theme is a fictional web shop called Nordlys that sells outdoor gear.

export type Document = {
  id: string;
  title: string;
  text: string;
};

export const documents: Document[] = [
  {
    id: "shipping-faq",
    title: "Shipping FAQ",
    text: `Nordlys ships to Norway, Denmark, Finland, and Germany. We do not ship to Sweden or the United States. Orders placed before 14:00 on a weekday leave the warehouse the same day.

Shipping within Norway costs 79 NOK and takes two to four working days. Shipping to Denmark, Finland, and Germany costs 149 NOK and takes four to seven working days. Orders above 1000 NOK ship for free to every country we serve.

Every parcel gets a tracking number by email when it leaves the warehouse. If a parcel has not arrived within ten working days, contact support with the order number and we will open a claim with the carrier.`,
  },
  {
    id: "returns-policy",
    title: "Returns and refunds",
    text: `You can return any unused item within 30 days of delivery. The item must be in its original packaging with all tags attached. Worn or washed clothing cannot be returned unless it is faulty.

To start a return, log in to your account, open the order, and press "Return item". Print the prepaid label and hand the parcel to any carrier drop-off point. Return shipping is free within Norway. For other countries we deduct 149 NOK from the refund.

Refunds go back to the original payment method within five working days after the parcel reaches our warehouse. Gift card purchases are refunded to a new gift card.`,
  },
  {
    id: "fjell-jacket",
    title: "Fjell 3L shell jacket",
    text: `The Fjell 3L is a three layer waterproof shell for hiking and ski touring. It has a 20,000 mm water column rating and 20,000 g breathability. The outer fabric is 100 percent recycled polyester with a fluorocarbon free water repellent finish.

The jacket weighs 380 grams in size medium. It has pit zips, a helmet compatible hood, two chest pockets placed above a backpack hip belt, and an inner mesh pocket. The main zipper is water resistant and has a storm flap.

The Fjell 3L is available in sizes XS to XXL and in the colors Moss, Slate, and Ember. It costs 3499 NOK and comes with a five year warranty on seams and zippers.`,
  },
  {
    id: "vidda-tent",
    title: "Vidda 2 tent",
    text: `The Vidda 2 is a two person tunnel tent for three season use. It has a single inner and one large vestibule with room for two backpacks. Pitching takes about five minutes with the fly and inner going up together.

The packed weight is 2.1 kilograms including pegs and repair sleeve. The fly is 40 denier ripstop nylon with a 3000 mm water column. The floor is 70 denier nylon with a 10,000 mm water column. Poles are DAC aluminium.

The Vidda 2 costs 4999 NOK. A footprint is sold separately for 499 NOK. Do not store the tent wet, since this damages the coating and is not covered by the warranty.`,
  },
  {
    id: "size-guide",
    title: "Size guide for clothing",
    text: `Nordlys clothing uses European sizing. Measure your chest at the widest point and your waist at the narrowest point, wearing only a base layer.

For jackets, size S fits a chest of 88 to 94 cm, M fits 94 to 100 cm, L fits 100 to 106 cm, XL fits 106 to 112 cm, and XXL fits 112 to 118 cm. Shell jackets are cut to fit a fleece underneath, so choose your normal size.

For trousers, size S fits a waist of 76 to 82 cm, M fits 82 to 88 cm, L fits 88 to 94 cm, and XL fits 94 to 100 cm. All trousers come in a regular inseam of 82 cm. A long inseam of 87 cm is available on the Fjell and Vidda trouser lines.`,
  },
  {
    id: "warranty",
    title: "Warranty and repairs",
    text: `All Nordlys products carry a two year warranty against defects in materials and workmanship. Fjell series jackets and trousers carry an extended five year warranty on seams and zippers. Tents carry a three year warranty on poles and fabric.

The warranty does not cover normal wear, damage from misuse, damage from storing gear wet, or damage from washing with fabric softener. Cosmetic changes such as fading are not defects.

For repairs outside the warranty we offer a paid repair service in our Oslo workshop. Common repairs such as replacing a zipper slider or patching a tear cost between 200 and 600 NOK. Send an email to repairs@nordlys.example with photos of the damage to get a quote.`,
  },
];
