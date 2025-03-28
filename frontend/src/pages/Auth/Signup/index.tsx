import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
import loginImage from "@/assets/login-image.jpg";
import { Link } from "react-router-dom";
import { paths } from "@/utils/path";

const formSchema = z.object({
  email: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    {
      message: "Username must be a valid email.",
    },
  ),
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  phone: z.string().refine(
    (value) => {
      const phoneRegex = /^[0-9]{10,15}$/;
      return phoneRegex.test(value);
    },
    {
      message: "It must be a phone number.",
    },
  ),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

export default function SignupPage() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div className="grid lg:grid-cols-2 my-5 items-center lg:mx-7 sm:mx-5 mx-3 flex-1 mt-3">
      <div id="login__left" className="h-scree flex flex-col items-center">
        <div
          className="left text-4xl font-bold"
          style={{
            fontFamily: "'Lato', 'Roboto', sans-serif",
          }}
        >
          <h2 className="block">Trường đại học Bách Khoa - ĐHQG HCM</h2>
          <h3>Online HealthCare</h3>
        </div>
        <img
          src={loginImage}
          alt="Login"
          className="w-3/5 object-cover aspect-square block mt-6"
        />
      </div>
      <div id="login__right" className="flex justify-center items-center">
        <div className="left mt-20 w-full max-w-md">
          <h1 className="text-4xl text-center">Sign up</h1>
          <div className="mt-5">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="text-xl font-light">
                          Tên đăng nhập
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nguyễn Văn A"
                          {...field}
                          className="w-full border-2 border-blue-300 h-[4rem] rounded-4xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="text-xl font-light">Email</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="helloworld@example.com"
                          {...field}
                          className="w-full border-2 border-blue-300 h-[4rem] rounded-4xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="text-xl font-light">
                          Số điện thoại
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0394529624"
                          {...field}
                          className="w-full border-2 border-blue-300 h-[4rem] rounded-4xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="text-xl font-light">Mật khẩu</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456"
                          {...field}
                          className="w-full border-2 border-blue-300 h-[4rem] rounded-4xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-[3rem] rounded-2xl hover:bg-blue-800 bg-blue-400"
                >
                  Đăng ký
                </Button>
                <Link to={paths.Login} className="text-center">
                  <span className="text-blue-500">Đã có tài khoản?</span>
                </Link>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
