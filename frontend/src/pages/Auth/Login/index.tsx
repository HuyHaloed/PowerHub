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
import { Checkbox } from "@/components/ui/checkbox";
import loginImage from "/src/assets/login-image.png";
import logo from "/src/assets/logo.png";

const formSchema = z.object({
  username: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    {
      message: "Username must be a valid email or phone number.",
    },
  ),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

export default function LoginPage() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div>
      <div className="grid grid-cols-2 ">
        <div
          id="login__left"
          className="h-scree flex flex-col items-center mt-8"
        >
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
            <h1 className="text-4xl text-center">Login</h1>
            <div className="mt-5">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="text-xl font-light">
                            Email hoặc số điện thoại
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="bespringmike@lonton.com"
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
                    Đăng nhập
                  </Button>
                  <Checkbox id="terms1" />
                  <label
                    htmlFor="terms1"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2"
                  >
                    Ghi nhớ tài khoản
                  </label>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
