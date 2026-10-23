export function PetpoojaGuide() {
  return (
    <div className="petpooja-guide">
      <header>
        <span className="eyebrow">Owner</span>
        <h2 className="h-display h-md" style={{ margin: "0.2rem 0 0" }}>
          Petpooja
        </h2>
        <p className="muted" style={{ maxWidth: 680 }}>
          This screen explains a future link. It does not connect to Petpooja, and it does not
          send or receive an order.
        </p>
      </header>

      <section className="petpooja-card">
        <h3>Today</h3>
        <p>
          Swiggy and Zomato alert the restaurant on their own partner apps. Reception copies
          that order into Online and marks the source. Takeaway and dine-in stay on this site.
          Nothing is sent to Petpooja.
        </p>
      </section>

      <section className="petpooja-card">
        <h3>Later, Petpooja into this site</h3>
        <p>
          Orders that already land in Petpooja can be forwarded here. Reception would no longer
          retype Swiggy and Zomato orders. The owner and receptionist would still get the alert
          on this site.
        </p>
      </section>

      <section className="petpooja-card">
        <h3>Later, this site into Petpooja</h3>
        <p>
          A dine-in, online, or takeaway order placed here can be pushed into Petpooja so
          Petpooja prints the kitchen slip. Petpooja can send back accepted, rejected, and ready.
        </p>
      </section>

      <section className="petpooja-card">
        <h3>What has to be in place first</h3>
        <ul>
          <li>Petpooja issues an app key, an app secret, an access token, and the restaurant id.</li>
          <li>Each dish on this site is matched to the same dish in Petpooja, including its variation.</li>
          <li>One API access covers both directions. There is not a second fee for sending website orders in.</li>
        </ul>
      </section>

      <section className="petpooja-card">
        <h3>What Petpooja lists</h3>
        <p>
          Prices below are before tax, from Petpooja’s public India page. They mark them as
          indicative. Add 18% GST. The page does not make the billing period obvious. An outlet
          that already uses Petpooja should read the price in its own Petpooja Marketplace,
          because a renewal can be lower than this new-customer list.
        </p>
        <table className="petpooja-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Listed price</th>
              <th>What it is for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base</td>
              <td>₹12,000</td>
              <td>Billing, inventory, and Swiggy and Zomato orders inside Petpooja</td>
            </tr>
            <tr>
              <td>Operations Growth</td>
              <td>₹20,000</td>
              <td>Includes Base. This is where their India list puts API and ERP, so this is the tier for a website link</td>
            </tr>
            <tr>
              <td>Operations Scale</td>
              <td>₹30,000</td>
              <td>Includes Growth, plus reservations, kiosk, and e-invoice credits</td>
            </tr>
            <tr>
              <td>Marketing Core</td>
              <td>₹20,000</td>
              <td>CRM, loyalty, and WhatsApp credits. Separate from the API</td>
            </tr>
            <tr>
              <td>Marketing Growth</td>
              <td>₹30,000</td>
              <td>More WhatsApp credits, a restaurant website, and a digital display</td>
            </tr>
            <tr>
              <td>Marketing Scale</td>
              <td>₹40,000</td>
              <td>More WhatsApp credits, plus Meta ads or two influencers</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="petpooja-card">
        <h3>What this link does not add</h3>
        <p>
          This website, Swiggy, and Zomato do not add a fee for the future link. The only new
          charge, if any, is Petpooja’s API tier, once, for both directions. Ask the Petpooja
          account manager which plan this outlet is already on before treating it as included.
        </p>
      </section>
    </div>
  );
}
