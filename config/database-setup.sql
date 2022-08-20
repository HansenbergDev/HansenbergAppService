CREATE TABLE IF NOT EXISTS students (
	id SERIAL NOT NULL,
	name VARCHAR(50),
	enrolled_from DATE,
	enrolled_to DATE,
	token VARCHAR(255),
	
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS menus (
     week DATE,
     monday VARCHAR(255),
     tuesday VARCHAR(255),
     wednesday VARCHAR(255),
     thursday VARCHAR(255),

     PRIMARY KEY(week)
);


CREATE TABLE IF NOT EXISTS enlistments (
  student_id INT,
  week DATE,
  monday BOOLEAN,
  tuesday BOOLEAN,
  wednesday BOOLEAN,
  thursday BOOLEAN,
  friday BOOLEAN,

  FOREIGN KEY (student_id) REFERENCES students(id)
	ON UPDATE CASCADE
	ON DELETE CASCADE,
  FOREIGN KEY (week) REFERENCES menus(week)
	ON UPDATE CASCADE
	ON DELETE CASCADE,
  PRIMARY KEY(student_id, week)
);

