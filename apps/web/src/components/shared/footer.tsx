function Footer() {
  return (
    <footer className="dark:bg-neutral-800 dark:text-white  py-6">
      <div className="container mx-auto px-4">
        <p className="text-center">
          &copy; {new Date().getFullYear()} OpenWord. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
