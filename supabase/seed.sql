-- Run AFTER 001_initial_schema.sql. Re-running updates the sample menu.
insert into public.products (id,name,description,category,price,image,vegetarian,badge,calories,available,sort_order) values
('golden-classic','The Golden Classic','Two juicy patties, melty cheddar, crisp lettuce & our signature sauce.','Burgers',22900,'/images/classic.jpg',false,'Bestseller',540,true,1),
('crispy-chicken','Crispy Chicken Club','Golden-fried chicken, crunchy slaw & a little kick of chipotle mayo.','Burgers',19900,'/images/chicken.jpg',false,'Fan favourite',480,true,2),
('garden-burger','Garden Goodness','A crisp veggie patty, fresh greens, tomato & creamy herb mayo.','Burgers',17900,'/images/veggie.jpg',true,null,390,true,3),
('golden-meal','Make It Golden Meal','Our classic burger, regular golden fries & an ice-cold cola.','Meals',34900,'/images/meal.png',false,'The whole deal',870,true,4),
('golden-fries','Golden Fries','Crispy on the outside. Fluffy on the inside. Perfectly salted.','Sides',9900,'/images/fries.jpg',true,null,280,true,5),
('chicken-bites','Crispy Chicken Bites','Six juicy, golden chicken bites with a smoky dipping sauce.','Sides',15900,'/images/bites.jpg',false,null,320,true,6),
('cold-cola','Ice-Cold Cola','A refreshing 350 ml cola. A perfect partner for every bite.','Drinks',6900,'/images/cola.jpg',true,null,140,true,7),
('chocolate-shake','Chocolate Shake','Thick, creamy chocolate goodness, blended fresh for you.','Drinks',14900,'/images/shake.jpg',true,null,310,true,8),
('choco-cookie','Warm Choco Cookie','Soft in the middle, crisp at the edges, loaded with chocolate.','Desserts',8900,'/images/cookie.jpg',true,null,240,true,9)
on conflict(id) do update set name=excluded.name, description=excluded.description, category=excluded.category,
price=excluded.price, image=excluded.image, vegetarian=excluded.vegetarian, badge=excluded.badge,
calories=excluded.calories, available=excluded.available, sort_order=excluded.sort_order;

