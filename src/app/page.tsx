import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Clock3,
  ChefHat,
  Ticket,
  ShoppingBag,
  Heart,
  Truck,
} from "lucide-react";
import { FulfillmentSelector } from "@/components/menu/FulfillmentSelector";
import { MenuSection } from "@/components/menu/MenuSection";
import { isDemo } from "@/lib/supabase/client";
export default function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span />A LITTLE JOY IN EVERY BITE
            </div>
            <h1>
              GOOD FOOD.
              <br />
              GREAT <span>MOOD.</span>
              <svg viewBox="0 0 290 13" aria-hidden="true">
                <path d="M3 9Q145-3 287 6" />
              </svg>
            </h1>
            <p>
              Big cravings meet their match.
              <br />
              Burgers, fries & all the feel-good favourites.
            </p>
            <Link href="#menu" className="button button-yellow">
              Find your happy meal <ArrowRight size={19} />
            </Link>
            <div className="hero-reassurance">
              <span>
                <ChefHat size={17} />
                Made fresh
              </span>
              <i />
              <span>
                <Heart size={17} />
                Made for you
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <span className="hero-orbit orbit-one" />
            <span className="hero-orbit orbit-two" />
            <span className="hero-spark spark-one">✳</span>
            <span className="hero-spark spark-two">✦</span>
            <img
              className="hero-food"
              src="/images/meal.png"
              alt="A double cheeseburger with golden fries and a cold drink"
              fetchPriority="high"
            />
            <div className="hero-sticker">
              <Sparkles size={17} />
              <span>
                100%<small>crave-worthy</small>
              </span>
            </div>
            <div className="hero-price">
              <small>A WHOLE LOT OF HAPPY</small>
              <b>Make it a meal.</b>
              <span>
                From ₹349 <ArrowUpRight size={17} />
              </span>
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <span>MORE CRUNCH.</span>
          <span className="little-star">✳</span>
          <span>MORE FLAVOUR.</span>
          <span className="little-star">✳</span>
          <span>MORE GOLDEN.</span>
          <span className="little-star">✳</span>
          <span>MORE YOU.</span>
          <span className="little-star">✳</span>
        </div>
      </section>
      <div className="container fulfillment-wrapper">
        <FulfillmentSelector />
        {isDemo && (
          <div className="demo-note">
            <span />
            You’re exploring our demo store. Try an order, then move it through
            the staff dashboard.
          </div>
        )}
      </div>
      <MenuSection />
      <section className="promo-section container">
        <div className="promo-copy">
          <span className="eyebrow">THE BEST THINGS COME TOGETHER</span>
          <h2>
            Good on its own.
            <br />
            <span>Golden as a meal.</span>
          </h2>
          <p>
            Your favourite burger + crispy fries + a cold drink.
            <br />
            Some things are just better together.
          </p>
          <Link className="button button-dark" href="#menu">
            Meet your perfect combo <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="promo-image">
          <img
            src="/images/meal.png"
            alt="Burger, fries and drink meal"
            loading="lazy"
          />
          <span className="promo-price">
            THE WHOLE
            <br />
            HAPPY DEAL<b>₹349</b>
          </span>
        </div>
      </section>
      <section id="how-it-works" className="how-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LESS WAITING. MORE BITING.</span>
            <h2>Your cravings. Your way.</h2>
            <p>A few taps between you and something delicious.</p>
          </div>
          <Link
            href={process.env.NEXT_PUBLIC_BOARD_URL || "/board"}
            className="text-button"
          >
            View live pickup screen <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="how-grid">
          <article>
            <span className="step-number">01</span>
            <ShoppingBag />
            <h3>Pick your favourites.</h3>
            <p>
              Build your bag with the bites that make you happy. Go on, add the
              fries.
            </p>
          </article>
          <article>
            <span className="step-number">02</span>
            <Truck />
            <h3>Choose your way.</h3>
            <p>
              Have it delivered to your door, or choose pickup and get your own
              order token.
            </p>
          </article>
          <article>
            <span className="step-number">03</span>
            <Ticket />
            <h3>We’ll take it from here.</h3>
            <p>
              Follow your order live. For pickup, collect at the counter when
              your token turns green.
            </p>
          </article>
        </div>
        <div className="fresh-strip">
          <Clock3 size={23} />
          <strong>Fresh takes a few minutes. Good things always do.</strong>
          <span>Pickup ~15–20 min · Delivery ~30–45 min</span>
        </div>
      </section>
    </main>
  );
}
